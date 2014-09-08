var sc = angular.module('stellarClient');

/**
 
 The StellarNetwork service is used to communicate with the Stellar network.

 @namespace  StellarNetwork */
sc.factory('StellarNetwork', function($rootScope, $timeout, $q) {
    var self   = {};
    self.remote    = null;
    self.connected = false;

    var handleDisconnect = function(e) {
        $timeout(function () {
            self.connected = false;
            $rootScope.connected = false;
            $rootScope.$broadcast('stellar-network:disconnected');
        });
    };

    var handleConnect = function (e) {
        $timeout(function () {
            // TODO: need to figure out why this isn't being set when we connect to the stellard
            self.remote._reserve_base=50*1000000;
            self.remote._reserve_inc=10*1000000;

            $rootScope.connected = true;
            $rootScope.$broadcast('stellar-network:connected');
        });
    };

    var handleTransaction = function(tx) {
      $timeout(function () {
        $rootScope.$broadcast('stellar-network:transaction', tx);
      });
    };

    self.init = function () {
        self.remote = new stellar.Remote(Options.server, true);
        self.remote.connect();
        self.remote.on('connected', handleConnect);
        self.remote.on('disconnected', handleDisconnect);
        self.remote.on('transaction', handleTransaction);
    };

    self.shutdown = function () {
        self.remote.disconnect();
        // self.remote = null;
    };

    self.request = function (method, params) {
        //TODO: throw a better error
        if (!self.remote) { throw new Error("Network is not initialized"); }
        var req = new stellar.Request(self.remote, method);

        // fold the params into the message object
        _.extend(req.message, params);

        var deferred = $q.defer();

        req.on('success', function(response) {
            deferred.resolve(response);
        });

        req.on('error', function (response) {
            return deferred.reject(response);
        });

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
        return new BigNumber(normalizedAmount.value).times(1000000).toString();
      } else {
        return _.cloneDeep(normalizedAmount);
      }
    };

    return self;
});