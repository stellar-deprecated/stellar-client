var sc = angular.module('stellarClient');

/**
 * The CurrencyPairs service provides two useful mechanisms for trading:  The means to 
 * favorite/unfavorite CurrencyPair objects, and the ability to apply a "priority"
 * given a currency pair.
 *
 * ### Prioritization
 * 
 * Prioritizing a CurrencyPair needs a little explanation.  The need arises from
 * the fact that the Stellar network does not apply any directionality to a trade:
 * Buying 10 STR for 0.25 USD is literally the same as selling 0.25 USD for 10 STR
 * in the ledger.  That is not desireable because traders often only think of one
 * direction, i.e.  BTC/USD or USD/EUR, not USD/BTC or EUR/USD.  
 * 
 * We need some mechanism to track the the base currency of any order so that we
 * can present it to the user in a way that makes sense to them.  This mechanism
 * is the priority system in this service.  Any time a trade is made, we call
 * {@link CurrencyPairs.recordPriority}, which establishes how the user wants the
 * given currency pair to be represented.
 *
 * After the fact, given an currencyPair (most likely pulled from an Offer) we
 * can call {@link CurrencyPairs.normalize} that will optionally reverse the pair
 * if the priority is towards the "opposite" pair.
 * 
 * @namespace CurrencyPairs
 * 
 */
sc.service('CurrencyPairs', function($q, session) {

  /**
   * Adds the provided currency pair to the wallet, marked as a favorite.
   * This method is a noop if the pair is already a favorite
   *
   * **NOTE: this does not save the wallet**
   * 
   * @param  {CurrencyPair} currencyPair the pair to favorite   
   * @memberOf CurrencyPairs
   */
  this.markFavorite = function(currencyPair) {
    if(this.isFavorite(currencyPair)) { return; }

    walletTradingPairs().favorites = getFavorites().concat(currencyPair);
  };

  /**
   * Removes the provided currency pair as a favroite, if it already was.
   *
   * **NOTE: this does not save the wallet**
   * 
   * @param  {CurrencyPair} currencyPair the currencyPair to remove
   * @memberOf CurrencyPairs
   */
  this.unmarkFavorite = function(currencyPair) {
    if(!this.isFavorite(currencyPair)) { return; }

    var newFavs = _.filter(getFavorites(), function(favoritePair) {
      return !_.isEqual(currencyPair, favoritePair);
    });

    walletTradingPairs().favorites = newFavs; 
  };

  /**
   * Returns true if the provided currency is a favorite.
   * 
   * @param  {CurrencyPair}  currencyPair the pair to test
   * @return {Boolean}                    true if a favorite, false if not
   * @memberOf CurrencyPairs
   */
  this.isFavorite = function(currencyPair) {
    return _.any(getFavorites(), function(favoritePair) {
      return _.isEqual(currencyPair, favoritePair);
    });
  };

  /**
   * Returns a list of favorite CurrencyPairs
   * @return {Array.<CurrencyPair>} the favorites
   * @memberOf CurrencyPairs
   */
  this.getFavorites = function() {
    return _.cloneDeep(getFavorites());
  };

  /**
   * Records that the given currencyPair is the prioritized pair (over the inverse)
   * 
   * @param  {CurrencyPair} currencyPair the pair the prioritize
   */
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
   * user's preferences.
   * 
   * @param  {Currency} currencyPair the pair to normalize
   * @return {CurrencyPair}          either the input pair if already correct, otherwise the inverse
   * @memberOf CurrencyPairs
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

  this.getKey = function(currencyPair) {
    function getKeyPart(currency) {
      var result = currency.currency;
      if(currency.issuer) {
        result += "/" + currency.issuer;
      }

      return result;
    }

    var basePart    = getKeyPart(currencyPair.baseCurrency);
    var counterPart = getKeyPart(currencyPair.counterCurrency);

    return basePart + ":" + counterPart;
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