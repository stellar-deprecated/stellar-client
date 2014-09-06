var sc = angular.module('stellarClient');

sc.factory('Trading', function($rootScope, $q, session, StellarNetwork, TransactionCurator) {
  var orderbooks = [];

  /**
   *
   * The main service that interacts with the trading features of the stellar network.
   *
   * This service provides methods that allows you to create/update/cancel trade offers,
   * as well as giving you means to retrieve {@link Structs.OrderBook} objects to give you information
   * about what trade offers are currently in the network.
   *
   * ### Emitted Events
   *
   * The Trading object broadcasts a series of events from the rootScope that
   * you can hook into to drive logic in your controllers:
   *
   * - `trading:my-offers:canceled`: The stellar network has successfully canceled 
   *   an offer from the current sessions's account 
   * - `trading:my-offers:created-unfilled`: The current account has created 
   *   an offer and it ended up in the appropriate order book unfilled
   * - `trading:my-offers:created-filled`: The current account has created 
   *   an offer and it was immediately filled
   * - `trading:my-offers:created-partially-filled`: The current account has created 
   *   an offer and it ended up in the appropriate order book.  It was also
   *   partially filled.
   * - `trading:my-offers:partially-filled`:  An order from the current account was partially filled by someone else's transaction
   * - `trading:my-offers:filled`: An order from the current account was filled by someone else's transaction
   *
   * @namespace Trading 
   */
  var Trading = {};

  $rootScope.$on('stellar-network:transaction', updateOrderBooks);
  $rootScope.$on('stellar-network:transaction', updateMyOffers);


  Trading.getOrderBook = function(takerPays, takerGets) {
    //TODO: the order book actually represents both "order books" for a given currency pair, we should canonicalize the currency so only one orderbook instance exists for a given pair 
    //TODO: don't allow more than one orderbook to exist for a given currency pair
    return new OrderBook(takerPays, takerGets);
  };

  Trading.myOffers = function() {
    var account = session.get("address");

    return StellarNetwork.request("account_offers", {
      account: account
    }).then(function(response) {
        var normalizedOffers = response.offers.map(function (nativeOffer) {
          return {
            account:   account,
            sequence:  nativeOffer.seq,
            takerPays: StellarNetwork.amount.decode(nativeOffer.taker_pays),
            takerGets: StellarNetwork.amount.decode(nativeOffer.taker_gets),
          };
        });

        return normalizedOffers;
    });
  };


  Trading.cancelOffer = function(sequence) {
    var tx = StellarNetwork.remote.transaction();

    tx.offerCancel({
      "account":  session.get("address"),
      "sequence": sequence,
    });

    return StellarNetwork.sendTransaction(tx);
  };

  var OrderBook = function(takerPays, takerGets) {
    this.takerPays = _.cloneDeep(takerPays);
    this.takerGets = _.cloneDeep(takerGets);
  };


  OrderBook.prototype.getOffers = function() {
    return StellarNetwork.request("book_offers", {
      "taker_pays": this.takerPays,
      "taker_gets": this.takerGets,
    }).then(function(response) {
      return response.offers;
    });
  };

  OrderBook.prototype.createOffer = function(takerPaysAmount, takerGetsAmount) {
    var tx = StellarNetwork.remote.transaction();

    var takerPays = _.extend({value:takerPaysAmount}, this.takerPays);
    var takerGets = _.extend({value:takerGetsAmount}, this.takerGets);

    tx.offerCreate({
      "account":    session.get("address"),
      "taker_pays": StellarNetwork.amount.encode(takerPays),
      "taker_gets": StellarNetwork.amount.encode(takerGets),
    });

    return StellarNetwork.sendTransaction(tx).then(function (tx) {
      console.log(tx);
      return {
        result: TransactionCurator.offerStateFromOfferCreate(tx),
        offer: TransactionCurator.offerFromOfferCreate(tx)
      };
    });
  };


  OrderBook.prototype.buy = function (amountToBuy, amountToPay) {
    //TODO
  };

  OrderBook.prototype.sell = function (amountToSell, amountToReceive) {
    //TODO
  };

  OrderBook.prototype.destroy = function() {
    this.unsubscribe();
  };

  OrderBook.prototype.subscribe = function() {
    return StellarNetwork.request("subscribe", this._subscribeParams());
  };

  OrderBook.prototype.unsubscribe = function() {
    return StellarNetwork.request("unsubscribe", this._subscribeParams());
  };

  OrderBook.prototype._subscribeParams = function() {
    return {
      "books": [{
        "taker_pays": this.takerPays,
        "taker_gets": this.takerGets,
        "snapshot":   true,
        "both":       true
      }]
    };
  };


  function updateOrderBooks(e, tx) {
    //TODO
  }

  /**
   * 
   * Inspects incoming transactions, sees whether or not they affect any of the current
   * accounts offers, and emits events in the stellar-network:my-offers:* namespace
   * 
   */
  function updateMyOffers(e, tx) {
    var type      = tx.transaction.TransactionType;
    var txAccount = tx.transaction.Account;
    var myAccount = session.get('address');

    if(type === 'OfferCancel' && txAccount === myAccount) {

      $rootScope.$broadcast("trading:my-offers:canceled", {
        account:  txAccount,
        sequence: tx.transaction.OfferSequence
      });

    } else if (type === 'OfferCreate' && txAccount === myAccount) {
 
      var offer      = TransactionCurator.offerFromOfferCreate(tx);
      var offerState = TransactionCurator.offerStateFromOfferCreate(tx);

      $rootScope.$broadcast("trading:my-offers:created-" + offerState, offer);

    } else if (_(['Payment', 'OfferCreate', 'OfferCancel']).contains(type)) {
      // extract any modified offers of mine, emit trading:my-offers:parially-filled event
      // extract any deleted offers of mine, emit trading:my-offers:filled event

      var updatedOffers = TransactionCurator.getOffersAffectedByTx(tx, 'ModifiedNode');
      var deletedOffers = TransactionCurator.getOffersAffectedByTx(tx, 'DeletedNode');

      _(deletedOffers).filter({account:myAccount}).each(function (offer) {
        $rootScope.$broadcast("trading:my-offers:filled", offer);
      });

      _(updatedOffers).filter({account:myAccount}).each(function (offer) {
        $rootScope.$broadcast("trading:my-offers:partially-filled", offer);
      });
    }
  }
 
  return Trading;
});