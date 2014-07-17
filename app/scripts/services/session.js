'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http, stNetwork) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ return cache[name] =  value; };

  Session.prototype.syncWallet = function(wallet, action) {
    var url = Options.WALLET_SERVER + '/wallets/' + action;
    var data = wallet.encrypt();

    return $http.post(url, data)
      .success(function (response) {
        if (Options.PERSISTENT_SESSION) {
          localStorage.wallet = JSON.stringify(wallet);
        }
      });
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

    // check for the most up to date fairy address
    checkFairyAddress.bind(this)();

    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});
    stNetwork.init();

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
    stNetwork.shutdown();

    this.put('loggedIn', false);

  };

  function checkFairyAddress() {
    var session = this;
    var config = {
      params: {
        destination: "stellarfoundation",
        domain: Options.DEFAULT_FEDERATION_DOMAIN
      }
    }
    $http.get(Options.API_SERVER + "/federation", config)
    .success(function (response) {
      var wallet = session.get('wallet');
      var contacts = wallet.mainData.contacts;
      var federation_record = response.federation_json;
      if (wallet.mainData.stellar_contact.destination_address != federation_record.destination_address) {
        // add it as the stellar contact
        wallet.mainData.stellar_contact = federation_record;
        // add this record to the contacts list
        contacts[federation_record.destination_address] = federation_record;
        session.syncWallet(wallet, 'update');
      }
    });
  }

  return new Session();
});