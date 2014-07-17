
/**
 * NETWORK
 *
 * The network service is used to communicate with the Ripple network.
 *
 * It encapsulates a ripple.Remote instance.
 */

var sc = angular.module('stellarClient');

module.factory('stNetwork', function($rootScope)
{
    var self   = {};
    self.remote    = new stellar.Remote(Options.server, true);
    self.connected = false;

    var handleDisconnect = function(e) {
        $rootScope.$apply(function () {
            self.connected = false;
            $rootScope.connected = false;
            $rootScope.$broadcast('$netDisconnected');
        });
    }

    var handleConnect = function (e) {
        $rootScope.$apply(function () {
            self.connected = true;
            $rootScope.connected = true;
            $rootScope.$broadcast('$netConnected');
        });
    };

    self.init = function () {
        self.remote.on('connected', handleConnect);
        self.remote.on('disconnected', handleDisconnect);
        self.remote.connect();
    };


    self.shutdown = function () {
        self.remote.removeListener('connected', handleConnect);
        self.remote.removeListener('disconnected', handleDisconnect);
        self.remote.disconnect();
    };

    return self;
});