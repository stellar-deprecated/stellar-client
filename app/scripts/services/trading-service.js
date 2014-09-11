var sc = angular.module('stellarClient');

sc.factory('Trading', function($rootScope, $q, session, StellarNetwork, TransactionCurator, OrderBook, TradingOps, CurrencyPairs, FriendlyOffers) {
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
   * - `trading:order-books:updated`: Emitted when an orderbook is updated
   * 
   *
   * @namespace Trading 
   */
  var Trading = {};

  $rootScope.$on('stellar-network:transaction', updateMyOffers);


  Trading.getOrderBook = function(currencyPair) {
    //TODO: the order book actually represents both "order books" for a given currency pair, we should canonicalize the currency so only one orderbook instance exists for a given pair 
    //TODO: don't allow more than one orderbook to exist for a given currency pair
    return OrderBook.get(currencyPair);
  };

  Trading.createOffer = function(takerPays, takerGets) {
    return TradingOps.createOffer(takerPays, takerGets);
  };

  Trading.myOffers = function() {
    return TradingOps.myOffers();
  };


  Trading.cancelOffer = function(sequence) {
    return TradingOps.cancelOffer(sequence);
  };

  /** @namespace Trading.offer */
  Trading.offer = {};

  Trading.offer.toFriendlyOffer = function(offer) {
    
    var currencyPair = CurrencyPairs.normalize({
      baseCurrency:    _.pick(offer.takerPays, 'currency', 'issuer'),
      counterCurrency: _.pick(offer.takerGets, 'currency', 'issuer'),
    });

    return FriendlyOffers.get(offer, currencyPair);
  };

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