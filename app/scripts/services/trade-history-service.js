'use strict';

var sc = angular.module('stellarClient');

/**
 * The TradeHistory provides paginated access to completed trades.
 *
 * ### Emitted Events
 *
 * The TradeHistory object broadcasts a series of events from the rootScope that
 * you can hook into to drive logic in your controllers:
 *
 * - `trade-history:new`: The stellar network has added a transaction affecting
 * an offer placed by the current account.
 *
 * @namespace TradeHistory
 */
sc.service('TradeHistory', function($rootScope, TransactionHistory, Trading, session) {
  TransactionHistory.onTransaction(function(transaction) {
    var trade = processTradeOnce(transaction);
    $rootScope.$broadcast('trade-history:new', trade);
  }, tradeFilter);

  var TRADE_TYPE = {
    NOT_TRADE:    'NOT_TRADE',
    OFFER_CREATE: 'OFFER_CREATE',
    OFFER_TAKE:   'OFFER_TAKE',
    PAYMENT_TAKE: 'PAYMENT_TAKE'
  };

  /**
   * Determine how the transaction affected the account's offer.
   *
   * @param {Object} transaction
   *
   * @return {TRADE_TYPE}
   */
  function tradeType(transaction) {
    var address = session.get('address');

    var isSuccessful  = transaction.meta.TransactionResult === 'tesSUCCESS';
    var isOffer       = transaction.tx.TransactionType     === 'OfferCreate';
    var isPayment     = transaction.tx.transactionType     === 'Payment';

    var isAccount     = transaction.tx.Account             === address;
    var isDestination = transaction.tx.Destination         === address;

    var isMyOffer      = isSuccessful && isOffer && isAccount;
    var isOtherOffer   = isSuccessful && isOffer && !isAccount;
    var isOtherPayment = isSuccessful && isPayment && !isAccount && !isDestination;

    if(isMyOffer)    { return TRADE_TYPE.OFFER_CREATE; }
    if(isOtherOffer) { return TRADE_TYPE.OFFER_TAKE; }
    if(isOtherPayment) { return TRADE_TYPE.PAYMENT_TAKE; }

    return TRADE_TYPE.NOT_TRADE;
  }

  /**
   * Return true if the transaction affected one the current account's offers.
   *
   * @param {Object} transaction
   *
   * @return {Boolean}
   */
  function tradeFilter(transaction) {
    var type = tradeType(transaction);

    if(type === TRADE_TYPE.OFFER_CREATE) {
      var balanceChanges = processOfferCreateOnce(transaction);

      if(!_.keys(balanceChanges).length) {
        // The created offer did not immediately fill any existing offers.
        return false;
      }
    }

    return type !== TRADE_TYPE.NOT_TRADE;
  }

  /**
   * Agregate the account's balance changes into a friendly offer that
   * summarizes the overall trade.
   *
   * @param {Object} transaction
   *
   * @return {FriendlyOffer}
   */
  function processTrade(transaction) {
    var balanceChanges = {};

    switch(tradeType(transaction)) {
    case TRADE_TYPE.OFFER_CREATE:
      balanceChanges = processOfferCreateOnce(transaction);
      break;

    case TRADE_TYPE.OFFER_TAKE:
    case TRADE_TYPE.PAYMENT_TAKE:
      balanceChanges = processOfferTake(transaction);
      break;
    }

    var offer = {};
    balanceChanges.forEach(function(balanceChange) {
      if(balanceChange.value.greaterThan(0)) {
        offer.takerPays = _.pick(balanceChange, ['currency', 'issuer']);
        offer.takerPays.value = balanceChange.value.toString();
      } else {
        offer.takerGets = _.pick(balanceChange, ['currency', 'issuer']);
        offer.takerGets.value = balanceChange.value.negated().toString();
      }
    });

    var trade = Trading.offer.toFriendlyOffer(offer);
    trade.date = stellar.utils.toTimestamp(transaction.tx.date);

    return trade;
  }

  var processTradeOnce = _.memoize(processTrade, function(transaction) {
    return transaction.tx.hash;
  });

  /**
   * Aggregate the account's balance changes occuring from an offer the account placed.
   *
   * @param {Object} transaction
   *
   * @return {Array.<Object>} The changes in the account's balances.
   */
  function processOfferCreate(transaction) {
    var address = session.get('address');
    var balanceChanges = getBalanceChanges(transaction, address);

    // Adjust STR for the transaction fee taken.
    var fee = new BigNumber(transaction.tx.Fee).dividedBy(1000000);
    var stellarBalanceChange = _.find(balanceChanges, {currency: 'STR'});
    stellarBalanceChange.value = stellarBalanceChange.value.plus(fee);

    if(stellarBalanceChange.value.equals(0)) {
      balanceChanges = _.reject(balanceChanges, {currency: 'STR'});
    }

    return balanceChanges;
  }

  var processOfferCreateOnce = _.memoize(processOfferCreate, function(transaction) {
    return transaction.tx.hash;
  });

  /**
   * Aggregate the account's balance changes occuring from an offer another account placed
   * or a payment that took a path through the account's offer.
   *
   * @param {Object} transaction
   *
   * @return {Array.<Object>} The changes in the account's balances.
   */
  function processOfferTake(transaction) {
    var address = session.get('address');
    var balanceChanges = getBalanceChanges(transaction, address);

    return balanceChanges;
  }


  /**
   * Aggregate the account's balance changes from the nodes in a transaction's meta.
   *
   * @param {Object} transaction
   *
   * @return {Array.<Object>} The changes in the account's balances.
   */
  function getBalanceChanges(transaction, address) {
    var balanceChanges = [];
    var node, balanceChange, value;

    transaction.meta.AffectedNodes.forEach(function(affect) {
      if(affect.ModifiedNode) {
        node = affect.ModifiedNode;

        switch(node.LedgerEntryType) {
        case 'RippleState':
          // Handle changes in non-STR currency balance.
          var isHighIssuer = node.FinalFields.HighLimit.issuer === address;
          var isLowIssuer  = node.FinalFields.LowLimit.issuer  === address;

          balanceChange = _.pick(node.FinalFields.Balance, ['currency', 'issuer']);
          value = new BigNumber(node.FinalFields.Balance.value).minus(node.PreviousFields.Balance.value);

          if(isHighIssuer) {
            balanceChange.value = value.negated();
            balanceChanges.push(balanceChange);
          }

          if(isLowIssuer) {
            balanceChange.value = value;
            balanceChanges.push(balanceChange);
          }
          break;

        case 'AccountRoot':
          // Handle changes in STR balance.
          if(node.FinalFields && node.FinalFields.Account === address) {
            value = new BigNumber(node.FinalFields.Balance).minus(node.PreviousFields.Balance).dividedBy(1000000);
            balanceChange = {
              currency: 'STR',
              value: value
            };
            balanceChanges.push(balanceChange);
          }
          break;
        }
      }

      // Handle new currency balances.
      if(affect.CreatedNode && affect.CreatedNode.LedgerEntryType === 'RippleState') {
        node = affect.CreatedNode;
        balanceChange = _.pick(node.NewFields.Balance, ['currency', 'issuer']);
        balanceChange.value = new BigNumber(node.NewFields.Balance.value);
        balanceChanges.push(balanceChange);
      }

      // Handle removed currency balances.
      if(affect.DeletedNode && affect.DeletedNode.LedgerEntryType === 'RippleState') {
        node = affect.DeletedNode;
        balanceChange = _.pick(node.NewFields.Balance, ['currency', 'issuer']);
        balanceChange.value = new BigNumber(node.PreviousFields.Balance.value).negated();
        balanceChanges.push(balanceChange);
      }
    });

    // Consolidate multiple changes of the same currency.
    balanceChanges = _(balanceChanges)
      .groupBy(function(balanceChange) {
        return [balanceChange.currency, balanceChange.issuer];
      })
      .map(function(currencyChanges) {
        var currencyChange = _.pick(currencyChanges[0], ['currency', 'issuer']);
        currencyChange.value = currencyChanges.reduce(function(totalValue, nextChange) {
          return totalValue.plus(nextChange.value);
        }, new BigNumber(0));

        return currencyChange;
      })
      .value();

    return balanceChanges;
  }

  /**
   * Get the Nth page of trades.
   *
   * @param {Number} pageNumber
   *
   * @return {Promise.<Array>}
   */
  function getPage(pageNumber) {
    return TransactionHistory.getPage(pageNumber, tradeFilter)
      .then(function(transactions) {
        return _.map(transactions, processTradeOnce);
      });
  }

  /**
   * Get the page number of the last page of trades.
   * Returns Infinity if the last page has not been determined.
   *
   * @return {Number | Infinity}
   */
  function lastPage() {
    return TransactionHistory.lastPage(tradeFilter);
  }

  return {
    getPage: getPage,
    lastPage: lastPage
  };
});
