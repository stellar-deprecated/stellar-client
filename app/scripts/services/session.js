'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ return cache[name] =  value; };

  // TODO: Think about moving this.
  Session.prototype.syncWallet = function(wallet, action, success, fail) {
    // Send it to the server.
    $.ajax({
      url: Options.WALLET_SERVER + '/wallets/' + action,
      method: 'POST',
      data: JSON.stringify(wallet.encrypt()),
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      success: function() {
        if (Options.PERSISTENT_SESSION) {
          localStorage.wallet = JSON.stringify(wallet);
        }
        if (success) {
          success();
        }
      }
    }).fail(fail || function(){});
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

    this.put('loggedIn', false);
  };

  return new Session();
});