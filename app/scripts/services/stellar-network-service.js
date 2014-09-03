
/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var sc = angular.module('stellarClient');

sc.factory('StellarNetwork', function($rootScope, $timeout) {

    var self   = {};
    self.remote    = null;
    self.connected = false;

    var handleDisconnect = function(e) {
        $timeout(function () {
            self.connected = false;
            $rootScope.connected = false;
            $rootScope.$broadcast('$netDisconnected');
        });
    };

    var handleConnect = function (e) {
        $timeout(function () {
            // TODO: need to figure out why this isn't being set when we connect to the stellard
            self.remote._reserve_base=50*1000000;
            self.remote._reserve_inc=10*1000000;

            $rootScope.connected = true;
            $rootScope.$broadcast('$netConnected');
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

    return self;
});