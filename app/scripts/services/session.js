'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http, $timeout, stNetwork) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ return cache[name] =  value; };


  /**
   * Record user activity, resetting the idle timeout
   * NOTE:  we debounce this function at the second level so we aren't
   * resetting the timer after every key press/click.  Second-level granularity
   * is enough.
   */
  Session.prototype.act = _.debounce(function() {
    if(this.get('loggedIn') === true) {
      this.clearIdleTimeout();
      this.setIdleTimeout();
    }
  }, 1000, true);

  Session.prototype.setIdleTimeout = function() {
    var self = this;

    this.idleTimeout = $timeout(function() {
      self.logout();
      $rootScope.$broadcast('idleLogout', {loggedOutAt: new Date()});
    }, Options.IDLE_LOGOUT_TIMEOUT || 15 * 60 * 1000);
  };

  Session.prototype.clearIdleTimeout = function() {
    if (this.idleTimeout) {
      $timeout.cancel(this.idleTimeout);
    }
  };

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
    // pull down this user's profile picture
    loadProfilePicture.bind(this)();
    $rootScope.account = {}
    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});
    stNetwork.init();

    this.setIdleTimeout();
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

  Session.prototype.logout = function() {
    cache = {};

    if (Options.PERSISTENT_SESSION){
      delete localStorage.wallet;
    }

    delete $rootScope.account;
    stNetwork.shutdown();

    this.put('loggedIn', false);

    this.clearIdleTimeout();


  };

  /**
  * This function will set the session variable profilePictureLink and also sync it to the
  * server.
  */
  Session.prototype.setProfilePicture = function(link) {
    this.put('profilePictureLink', link);
    $rootScope.$broadcast('profilePictureLinkChanged');

    // sync to API server
    var params = {
      username: this.get('username'),
      updateToken: this.get('wallet').keychainData.updateToken,
      link: link
    }
    $http.post(Options.API_SERVER + "/user/picture", params)
    .success(function (response) {
      // woohoo
    })
    .error(function (response) {
      // TODO: error syncing to server
    })
  };

  function checkFairyAddress() {
    var session = this;
    $http.get(Options.API_SERVER + "/fairy")
    .success(function (response) {
      var wallet = session.get('wallet');
      var contacts = wallet.mainData.contacts;
      var federation_record = response.data.federation_json;
      if (wallet.mainData.stellar_contact.destination_address != federation_record.destination_address) {
        // add it as the stellar contact
        wallet.mainData.stellar_contact = federation_record;
        // add this record to the contacts list
        contacts[federation_record.destination_address] = federation_record;
        session.syncWallet(wallet, 'update');
      }
    });
  }

  function loadProfilePicture() {
    var session = this;
    var config = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    }
    $http.get(Options.API_SERVER + "/user/picture", config)
    .success(function (response) {
      if (response.message) {
        session.put('profilePictureLink', response.message);
        $rootScope.$broadcast('profilePictureLinkChanged');
      }
    })
  }

  return new Session();
});