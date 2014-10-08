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
 * {@link CurrencyPairs.recordUse}, which establishes how the user wants the
 * given currency pair to be represented.
 *
 * After the fact, given an currencyPair (most likely pulled from an Offer) we
 * can call {@link CurrencyPairs.normalize} that will optionally reverse the pair
 * if the priority is towards the "opposite" pair.
 *
 * ### Order
 *
 * Any time a trade is made, we call {@link CurrencyPairs.recordUse} to move
 * the used currencyPair to the top of the favorites to keep the list sorted
 * latest first. {@link CurrencyPairs.getLastUsedFavorite} can be called to get
 * the last favorite that was used.
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
    if(isFavorite(currencyPair)) { return; }

    var favorites = [currencyPair].concat(getFavorites());
    setFavorites(favorites);
    syncWallet();
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
    if(!isFavorite(currencyPair)) { return; }

    var newFavs = _.filter(getFavorites(), function(favoritePair) {
      return !_.isEqual(currencyPair, favoritePair);
    });

    setFavorites(newFavs);
    syncWallet();
  };

  /**
   * Returns true if the provided currency is a favorite.
   * 
   * @param  {CurrencyPair}  currencyPair the pair to test
   * @return {Boolean}                    true if a favorite, false if not
   * @memberOf CurrencyPairs
   */
  this.isFavorite = function(currencyPair) {
    return isFavorite(currencyPair);
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
   * Moves the used favorite currency pair to the top of the favorites
   * and records the priority of the currency pair
   * @param {CurrencyPair} the last favorite CurrencyPair that was used
   * @memberOf CurrencyPairs
   */
  this.recordUse = function(currencyPair) {
    moveFavoriteToTop(currencyPair);
    recordPriority(currencyPair);
    syncWallet();
  };

  /**
   * Returns the last favorite CurrencyPair that was used
   * @return {CurrencyPair} the last favorite CurrencyPair that was used
   * @memberOf CurrencyPairs
   */
  this.getLastUsedFavorite = function() {
    // the favorite CurrencyPairs are sorted last used first
    return _.cloneDeep(getFavorites()[0]);
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
      return this.invert(currencyPair);
    }
  };

  this.invert = function(currencyPair) {
    return {
      baseCurrency:    currencyPair.counterCurrency,
      counterCurrency: currencyPair.baseCurrency
    };
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

  function moveFavoriteToTop(currencyPair) {
    if(isFavorite(currencyPair)) {
      var favorites = _.reject(getFavorites(), currencyPair);
      setFavorites([currencyPair].concat(favorites));
    }
  }

  function recordPriority(currencyPair) {
    // we record the provided currency pair under two keys, one for each direction
    // this adds to the size of the wallet but greatly simplifies lookup

    var key1 = priorityKey(currencyPair.baseCurrency, currencyPair.counterCurrency);
    var key2 = priorityKey(currencyPair.counterCurrency, currencyPair.baseCurrency);

    var priorities = getCurrencyPriorities();
    priorities[key1] = currencyPair.baseCurrency.currency;
    priorities[key2] = currencyPair.baseCurrency.currency;

    setCurrencyPriorities(priorities);
  }

  function priorityKey(currency1, currency2) {
    return currency1.currency +  ":" + currency2.currency;
  }

  function getCurrencyPriorities() {
    return walletTradingPairs().priorities;
  }

  function setCurrencyPriorities(priorities) {
    walletTradingPairs().priorities = priorities;
  }

  function getFavorites() {
    return walletTradingPairs().favorites;
  }

  function setFavorites(favorites) {
    walletTradingPairs().favorites = favorites;
  }

  function isFavorite(currencyPair) {
    return _.any(getFavorites(), function(favoritePair) {
      return _.isEqual(currencyPair, favoritePair);
    });
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

  function syncWallet() {
    //TODO: put this behind a debounced "save at your leisure type function" that
    //also doesn't actually sync if the wallets state hasn't changed
    session.syncWallet('update');
  }
});