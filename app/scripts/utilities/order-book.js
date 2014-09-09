angular.module('stellarClient').factory('OrderBook', function($q, TradingOps, StellarNetwork, CurrencyPairs) {

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

  OrderBook.prototype.getPriceLevels = function(offerType) {
    var offers = this.currentOffers[offerType];

    // map from offers to price/amount pairs
    // sum amounts at same price

    return offers;
  };

  OrderBook.prototype._subscribeParams = function() {
    return {
      "books": [{
        "taker_pays": this.counterCurrency,
        "taker_gets": this.baseCurrency,
        "snapshot":   true,
        "both":       true
      }]
    };
  };

  OrderBook.prototype._createOffer = function(takerPays, takerGets) {
    CurrencyPairs.recordPriority(this.getCurrencyPair());
    return TradingOps.createOffer(takerPays, takerGets);
  };

  return OrderBook;
});


