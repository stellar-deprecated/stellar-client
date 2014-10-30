var sc = angular.module('stellarClient');

/**
 
 The StellarNetwork service is used to communicate with the Stellar network.

 @namespace  StellarNetwork */
sc.factory('StellarNetwork', function($rootScope, $timeout, $q) {
    var self                  = {};
    self.remote               = null;
    self.connected            = false;
    self.waitingForConnection = null;

    var handleDisconnect = function(e) {
        $timeout(function () {
            self.connected = false;
            $rootScope.connected = false;
            $rootScope.$broadcast('stellar-network:disconnected');
        });
    };

    var handleReconnecting = function(timeout) {
        $timeout(function () {
            $rootScope.$broadcast('stellar-network:reconnecting', timeout);
        });
    };

    var handleConnecting = function() {
        $timeout(function () {
            $rootScope.$broadcast('stellar-network:connecting');
        });
    };

    var handleConnect = function (e) {
        $timeout(function () {
            /*jshint camelcase: false */
            // TODO: need to figure out why this isn't being set when we connect to the stellard
            self.remote._reserve_base=50*1000000;
            self.remote._reserve_inc=10*1000000;

            self.connected = true;
            $rootScope.connected = true;
            $rootScope.$broadcast('stellar-network:connected');

            if(self.waitingForConnection) {
                self.waitingForConnection.resolve();
            }
        });
    };

    var handleTransaction = function(tx) {
      $timeout(function () {
        $rootScope.$broadcast('stellar-network:transaction', tx);
      });
    };

    var init = function () {
        self.remote = new stellar.Remote(Options.server, true);
        self.remote.connect();
        self.remote.on('connected', handleConnect);
        self.remote.on('disconnected', handleDisconnect);
        self.remote.on('reconnecting', handleReconnecting);
        self.remote.on('connecting', handleConnecting);
        self.remote.on('transaction', handleTransaction);
    };

    self.forceReconnect = function () {
        if(self.remote) {
            /* jshint camelcase:false */
            self.remote.force_reconnect();
        } else {
            init();
        }
    };

    self.shutdown = function () {
        self.remote.disconnect();
        // self.remote = null;
    };

    self.ensureConnection = function() {
        if(self.connected) { 
            return $q.when();
        } else if (self.waitingForConnection) {
            return self.waitingForConnection.promise;
        } else {
            self.waitingForConnection = $q.defer();

            if(self.remote) {
                self.remote.connect();
            } else {
                init();
            }

            return self.waitingForConnection.promise;
        }
    };

    self.request = function (method, params) {
        //TODO: throw a better error
        if (!self.remote) { throw new Error("Network is not initialized"); }
        var req = new stellar.Request(self.remote, method);

        // fold the params into the message object
        _.extend(req.message, params);

        var deferred = $q.defer();

        req.on('success', deferred.resolve);
        req.on('error', deferred.reject);


        req.request();
        return deferred.promise;
    };

    self.sendTransaction = function(tx) {
        var deferred = $q.defer();

        tx.on('success', function(response) {
            deferred.resolve(response);
        });

        tx.on('error', function (response) {
            return deferred.reject(response);
        });

        tx.submit();

        return deferred.promise;
    };


    /** @namespace  StellarNetwork.amount */
    self.amount = {};

    /**
     * Normalizes a stellard native amount (which could be either a raw number
     * for STR or a currency/value/issuer object for other currencies) into our
     * normalized {@link Structs.Amount} form.
     *
     * @param {string|number|object} nativeAmount the amount as reported from json
     *                                            originating from stellard
     * @return {Structs.Amount} the normalized amount
     * @memberOf StellarNetwork.amount
     * @function decode
     */
    self.amount.decode = function(nativeAmount) {
      var amountType = typeof nativeAmount;
  
      switch(amountType) {
        case "string":
        case "number":
          return {
            currency: "STR",
            value: new BigNumber(nativeAmount).div(1000000).toString()
          };
        case "object":
          return _.cloneDeep(nativeAmount);
        default:
          throw new Error("invalid amount type " + amountType + ": expected a string, number, or object");
      }
    };

    /**
     * Converts a account line returned from stellard's account_line and
     * turns it into a amount struct
     *
     * @param {object} accountLine an accountLine object from stellard's account_line
     * @return {Structs.Amount} amount struct built from the account line
     * @memberOf StellarNetwork.amount
     * @function decodeFromAccountLine
     */
    self.amount.decodeFromAccountLine = function(accountLine) {
      if (typeof accountLine !== 'object') {
          throw new Error("invalid accountLine type " + typeof accountLine + ": expected an object");
      }

      return {
          currency: accountLine.currency,
          value: accountLine.balance,
          issuer: accountLine.account
        };
    };

    /**
     * Given a {@link Structs.Amount}, convert it back to a form that can be used
     * in communication with stellard
     * 
     * @param  {Structs.Amount} normalizedAmount
     * @return {string|object}                  
     * @memberOf StellarNetwork.amount
     * @function encode
     */
    self.amount.encode = function(normalizedAmount) {
      if(normalizedAmount.currency === "STR") {
        var stroopAmount = new BigNumber(normalizedAmount.value).times(1000000);

        // confirm there resultant stroop value isn't fractional
        var hasFraction = !stroopAmount.ceil().equals(stroopAmount);
        if(hasFraction) {
          throw new Error("Cannot encode STR amount: " + normalizedAmount.value);
        }

        return stroopAmount.toString();
      } else {
        return _.cloneDeep(normalizedAmount);
      }
    };


    /** @namespace  StellarNetwork.currency */
    self.currency = {};
    /**
     * Normalizes a stellard native currency (which could be either STR or 
     * currency/issuer object for other currencies) into our normalized 
     * {@link Structs.Currency} form.
     *
     * @param {string|object} nativeCurrency 
     * @return {Structs.Currency} the normalized currency
     * @memberOf StellarNetwork.currency
     * @function decode
     */
    self.currency.decode = function(nativeCurrency) {
      var currencyType = typeof nativeCurrency;
  
      switch(currencyType) {
        case "string":
          return { currency: "STR" };
        case "object":
          return nativeCurrency;
        default:
          throw new Error("invalid currency type " + currencyType + ": expected a string, or object");
      }
    };


    /**
     * Given a {@link Structs.Currency}, convert it back to a form that can be used
     * in communication with stellard
     * 
     * @param  {Structs.Currency} normalizedCurrency
     * @return {string|object}                  
     * @memberOf StellarNetwork.currency
     * @function encode
     */
    self.currency.encode = function(normalizedCurrency) {
      if(normalizedCurrency.currency === "STR") {
        return normalizedCurrency.currency;
      } else {
        return normalizedCurrency;
      }
    };

    /** @namespace  StellarNetwork.offer */
    self.offer = {};

    
    self.offer.decode = function(nativeOffer) {
      var result       = {};
      result.account   = nativeOffer.Account;
      result.sequence  = nativeOffer.Sequence;
      result.takerPays = self.amount.decode(nativeOffer.TakerPays);
      result.takerGets = self.amount.decode(nativeOffer.TakerGets);

      return result;
    };


    return self;
});