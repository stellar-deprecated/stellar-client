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

    self.init = function () {
        self.remote = new stellar.Remote(Options.server, true);
        self.remote.connect();
        self.remote.on('connected', handleConnect);
        self.remote.on('disconnected', handleDisconnect);
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

    return self;
});