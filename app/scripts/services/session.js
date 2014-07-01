'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ return cache[name] =  value; };

  Session.prototype.syncWallet = function(wallet, action) {
    var url = Options.WALLET_SERVER + '/wallets/' + action;
    var data = wallet.encrypt();

    return $http.post(url, data);
  };

  Session.prototype.login = function(wallet) {
    this.put('wallet', wallet);

    if (Options.PERSISTENT_SESSION) {
      localStorage.wallet = JSON.stringify(wallet);
    }

    var signingKeys = wallet.keychainData.signingKeys;

    // Initialize the session with the wallet's data.
    this.put('username', wallet.mainData.username);
    this.put('signingKeys', signingKeys);
    this.put('address', signingKeys.address);

    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});

    // Set loggedIn to be true to signify that it is safe to use the session variables.
    this.put('loggedIn', true);
  };

  Session.prototype.loginFromStorage = function($scope) {
    if(localStorage.wallet) {
      try {
        var wallet = new Wallet(JSON.parse(localStorage.wallet));

        if (wallet) {
          this.login(wallet);
        }
      }
      catch(e) { }
    }
  };

  Session.prototype.logOut = function() {
    cache = {};

    if (Options.PERSISTENT_SESSION){
      delete localStorage.wallet;
    }
    if ($rootScope.account.cleanup) {
      $rootScope.account.cleanup();
    }
    delete $rootScope.account;

    this.put('loggedIn', false);
  };

  return new Session();
});