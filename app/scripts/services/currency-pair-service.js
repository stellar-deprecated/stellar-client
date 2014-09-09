var sc = angular.module('stellarClient');

sc.service('CurrencyPairs', function($q, session) {

  this.markFavorite = function(currencyPair) {
    if(this.isFavorite(currencyPair)) { return; }

    walletTradingPairs().favorites = getFavorites().concat(currencyPair); 
  };

  this.unmarkFavorite = function(currencyPair) {
    if(!this.isFavorite(currencyPair)) { return; }

    var newFavs = _.filter(getFavorites(), function(favoritePair) {
      return !_.isEqual(currencyPair, favoritePair);
    });

    walletTradingPairs().favorites = newFavs; 
  };

  this.isFavorite = function(currencyPair) {
    return _.any(getFavorites(), function(favoritePair) {
      return _.isEqual(currencyPair, favoritePair);
    });
  };

  this.getFavorites = function() {
    return _.cloneDeep(getFavorites());
  };

  this.recordPriority = function(currencyPair) {
    // we record the provided currency pair under two keys, one for each direction
    // this adds to the size of the wallet but greatly simplifies lookup

    var key1 = priorityKey(currencyPair.baseCurrency, currencyPair.counterCurrency);
    var key2 = priorityKey(currencyPair.counterCurrency, currencyPair.baseCurrency);

    getCurrencyPriorities()[key1] = currencyPair.baseCurrency.currency;
    getCurrencyPriorities()[key2] = currencyPair.baseCurrency.currency;

    //TODO: but this behind a debounced "save at your leisure type function" that
    //also doesn't actually sync if the wallets state hasn't changed
    session.syncWallet('update');
  };

  /**
   * Given two currencies, return the most appropriate currency pair given the 
   * user's preferences as well as the defaults.
   *
   * 
   * @param  {Currency} currency1 [description]
   * @param  {Currency} currency2 [description]
   * @return {CurrencyPair}       [description]
   */
  this.normalize = function(currencyPair) {
    // find the first pair that in walletTradingPairs that uses these currencies, and use that if found
    var key      = priorityKey(currencyPair.baseCurrency, currencyPair.counterCurrency);
    var priority = getCurrencyPriorities()[key];

    // if we don't have an explicitly record priority, dont modify
    if(!priority){ return currencyPair; }

    if(priority === currencyPair.baseCurrency.currency) { 
      return currencyPair; 
    } else {
      return {
        baseCurrency:    currencyPair.counterCurrency,
        counterCurrency: currencyPair.baseCurrency
      };
    }
  };

  function priorityKey(currency1, currency2) {
    return currency1.currency +  ":" + currency2.currency;
  }

  function getCurrencyPriorities() {
    return walletTradingPairs().priorities;
  }

  function getFavorites() {
    return walletTradingPairs().favorites;
  }

  function walletTradingPairs() {
    var mainData = session.get('wallet').mainData;
    
    if(!_.isPlainObject(mainData.tradingPairs)) {
      mainData.tradingPairs = {
        favorites:  [],
        priorities: {}
      };
    }

    return mainData.tradingPairs;
  }
});