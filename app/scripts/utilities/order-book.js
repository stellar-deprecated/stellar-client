angular.module('stellarClient').factory('OrderBook', function($q, $rootScope, TradingOps, StellarNetwork, CurrencyPairs, TransactionCurator, FriendlyOffers) {

  var orderbooks = {};

  $rootScope.$on('stellar-network:transaction', updateOrderBooks);
  $rootScope.$on('trading:trade', updateLastPrices);

  var getOrderBook = function(currencyPair) {
    var bookKey = CurrencyPairs.getKey(currencyPair);
    var result = orderbooks[bookKey];

    if(!result) {
      result = new OrderBook(currencyPair.baseCurrency, currencyPair.counterCurrency);
      orderbooks[bookKey] = result;
    }

    return result;
  };

  var mergePriceLevels = function(priceLevels, ascending) {

    function toBigNumber(priceLevel) {
      return _.mapValues(priceLevel, function(v, k) {
        if(k === 'currencyPair'){ return v; }
        return new BigNumber(v);
      });
    }
    function toString(priceLevel) {
      return _.mapValues(priceLevel, function(v, k) {
        if(k === 'currencyPair'){ return v; }
        return v.toString();
      });
    }
    function sortAscending(a, b) {
      return new BigNumber(a.price).cmp(b.price);
    }
    function sortDescending(a, b) {
      return sortAscending(b, a);
    }

    var merged = _(priceLevels)
      .map(toBigNumber)
      .groupBy('price')
      .map(function(priceLevels, price) {

        var sum = function(numbers) {
          return numbers.reduce(function(left, right) {
            return left.plus(right);
          });
        };

        var totalAmount = sum(_(priceLevels).pluck('amount'));
        var totalValue  = sum(_(priceLevels).pluck('totalValue'));

        return {
          price:      price,
          amount:     totalAmount,
          totalValue: totalValue,
        };
      });

    var sorted;

    if(ascending) {
      sorted = merged.sort(sortAscending);
    } else {
      sorted = merged.sort(sortDescending);
    }
        
    var result = sorted.map(toString);


    return result.value();
  };

  var OrderBook = function(baseCurrency, counterCurrency) {
    this.baseCurrency    = _.cloneDeep(baseCurrency);
    this.counterCurrency = _.cloneDeep(counterCurrency);
    this.currentOffers   = {};
    this.lastPrice       = null;
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

      $rootScope.$broadcast("trading:order-book-updated", self);
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
   */
  OrderBook.prototype.injestOffers = function(added, changed, removed) {
    var self = this;

    _.each(added, overwriteOffer);
    _.each(changed, overwriteOffer);
    _.each(removed, removeOffer);

    $rootScope.$broadcast("trading:order-book-updated", self);

    function overwriteOffer(offer) {
      removeOffer(offer);

      switch(self.getOfferRole(offer)) {
      case 'bid':
        self.currentOffers['bids'].push(offer);
        break;
      case 'ask':
        self.currentOffers['asks'].push(offer);
        break;
      }
    }

    function removeOffer(offer) {
      switch(self.getOfferRole(offer)) {
      case 'bid':
        self.currentOffers['bids'] = _.reject(self.currentOffers['bids'], _.pick(offer, 'account', 'sequence'));
        break;
      case 'ask':
        self.currentOffers['asks'] = _.reject(self.currentOffers['asks'], _.pick(offer, 'account', 'sequence'));
        break;
      }
    }
  };

  OrderBook.prototype.injestTrade = function(trade) {
    if (_.isEqual(this.getCurrencyPair(), trade.currencyPair)) {
      this.lastPrice = trade.price;
      $rootScope.$broadcast("trading:order-book-updated", this);
    }
  };

  OrderBook.prototype.getPriceLevels = function(offerType) {
    var offers       = this.currentOffers[offerType] || [];
    var currencyPair = this.getCurrencyPair();

    var priceLevels = offers.map(function(offer) {
      var friendlyOffer = FriendlyOffers.get(offer, currencyPair);
      return FriendlyOffers.toPriceLevel(friendlyOffer);
    });

    var result = mergePriceLevels(priceLevels, offerType === 'asks');
    
    return result;
  };


  OrderBook.prototype.getSummary = function() {
    var lowestAsk  = Util.tryGet(this.getPriceLevels('asks')[0], 'price');
    var highestBid = Util.tryGet(this.getPriceLevels('bids')[0], 'price');
    var spread;

    if(lowestAsk && highestBid) {
      spread = new BigNumber(lowestAsk).minus(highestBid).toString();
    } else {
      spread = null;
    }

    return {
      lowestAsk:  lowestAsk,
      highestBid: highestBid,
      spread:     spread,
      lastPrice:  this.lastPrice,
    };
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
    CurrencyPairs.recordUse(this.getCurrencyPair());
    return TradingOps.createOffer(takerPays, takerGets);
  };


  function updateOrderBooks(e, tx) {
    var added   = TransactionCurator.getOffersAffectedByTx(tx, 'CreatedNode');
    var changed = TransactionCurator.getOffersAffectedByTx(tx, 'ModifiedNode');
    var removed = TransactionCurator.getOffersAffectedByTx(tx, 'DeletedNode');

    _(orderbooks).each(function (orderbook, key) {
      orderbook.injestOffers(added, changed, removed);
    });
  }

  function updateLastPrices(e, trade) {
    _(orderbooks).each(function (orderbook, key) {
      orderbook.injestTrade(trade);
    });
  }

  return {
    get: getOrderBook
  };
});


