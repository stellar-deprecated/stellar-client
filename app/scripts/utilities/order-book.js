angular.module('stellarClient').factory('OrderBook', function($q, $rootScope, TradingOps, StellarNetwork, CurrencyPairs, TransactionCurator, FriendlyOffers) {

  var orderbooks = {};

  $rootScope.$on('stellar-network:transaction', updateOrderBooks);

  var getOrderBook = function(currencyPair) {
    var bookKey = CurrencyPairs.getKey(currencyPair);
    var result = orderbooks[bookKey];

    if(!result) {
      result = new OrderBook(currencyPair.baseCurrency, currencyPair.counterCurrency);
      orderbooks[bookKey] = result;
    }

    return result;
  };

  var OrderBook = function(baseCurrency, counterCurrency) {
    this.baseCurrency    = _.cloneDeep(baseCurrency);
    this.counterCurrency = _.cloneDeep(counterCurrency);
    this.currentOffers   = {};
  };

  OrderBook.prototype.getCurrencyPair = function() {
    return _.pick(this, 'baseCurrency', 'counterCurrency');
  };

  OrderBook.prototype.buy = function (amountToBuy, amountToPay) {
    var takerPays = _.extend({value:amountToBuy}, this.baseCurrency);
    var takerGets = _.extend({value:amountToPay}, this.counterCurrency);

    return this._createOffer(takerPays, takerGets);
  };


  OrderBook.prototype.sell = function (amountToSell, amountToReceive) {
    var takerGets = _.extend({value:amountToSell}, this.baseCurrency);
    var takerPays = _.extend({value:amountToReceive}, this.counterCurrency);

    return this._createOffer(takerPays, takerGets);
  };

  OrderBook.prototype.destroy = function() {
    this.unsubscribe();
  };

  OrderBook.prototype.subscribe = function() {
    var self = this;
    return StellarNetwork.request("subscribe", this._subscribeParams()).then(function (results) {
      // this should set the 
      
      var bids = results.bids.map(StellarNetwork.offer.decode);
      var asks = results.asks.map(StellarNetwork.offer.decode);

      self.currentOffers = {
        bids: bids,
        asks: asks
      };
    });
  };

  OrderBook.prototype.unsubscribe = function() {
    return StellarNetwork.request("unsubscribe", this._subscribeParams());
  };


  /**
   * Incorporate any Offers affected by the provided transaction, that also
   * apply to this OrderBook, into this order book.
   *
   * This method is the means through which we update order books in a live
   * manner.  Rather than having OrderBooks manage their own communication with
   * stellard (since subscriptions are owned on the Remote) t
   * 
   * @param  {[type]} tx [description]
   * @return {[type]}    [description]
   */
  OrderBook.prototype.injestOffers = function(offers) {
    console.log("injesting", this, offers);
  };

  OrderBook.prototype.getPriceLevels = function(offerType) {
    var offers = this.currentOffers[offerType];

    // map from offers to price/amount pairs
    // sum amounts at same price

    return offers;
  };

  /**
   * Returns a string value that represents how the provided offer applies
   * to this orderbook, either as a bid, or an ask, or as none (in the case
   * that the currencies are not equal to the currencyPair for this)
   * 
   * @param  {Offer} offer
   * @return {string}       "ask", "bid" or "none"
   */
  OrderBook.prototype.getOfferRole = function(offer) {
    return FriendlyOffers.getOfferRole(offer, this.getCurrencyPair());
  };

  OrderBook.prototype._subscribeParams = function() {
    return {
      "books": [{
        "taker_pays": this.baseCurrency,
        "taker_gets": this.counterCurrency,
        "snapshot":   true,
        "both":       true
      }]
    };
  };

  OrderBook.prototype._createOffer = function(takerPays, takerGets) {
    CurrencyPairs.recordPriority(this.getCurrencyPair());
    return TradingOps.createOffer(takerPays, takerGets);
  };


  function updateOrderBooks(e, tx) {
    console.log("updating orderbooks", tx);
    var offers = TransactionCurator.getOffersAffectedByTx(tx);

    //TODO
    // for each order book that has been initialized
    // find any offers that apply to it
    // replace the offer in the offers of the order book
    // broadcast the updated order book

    _(orderbooks).each(function (orderbook, key) {
      orderbook.injestOffers(offers);
    });
  }


  return {
    get: getOrderBook
  };
});


