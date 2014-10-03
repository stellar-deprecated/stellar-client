'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http, $timeout, StellarNetwork, Wallet, contacts, UserPrivateInfo) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ 
    cache[name] = value;
    return value; 
  };


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

    var wallet = this.get('wallet');
    if (wallet && this.isPersistent()) {
      wallet.bumpLocalTimeout();
    }

  }, 1000, true);

  Session.prototype.setIdleTimeout = function() {
    var self = this;

    this.idleTimeout = $timeout(function() {
      self.logout(true);
    }, Options.IDLE_LOGOUT_TIMEOUT || 15 * 60 * 1000);
  };

  Session.prototype.clearIdleTimeout = function() {
    if (this.idleTimeout) {
      $timeout.cancel(this.idleTimeout);
    }
  };

  Session.prototype.login = function(wallet) {
    var self = this;
    try {
      sessionStorage.displayReloadMessage = "display";
    } catch (e) {}

    this.put('wallet', wallet);

    if (this.isPersistent()) {
      wallet.saveLocal();
    } else {
      this.setIdleTimeout();
    }

    var signingKeys = wallet.keychainData.signingKeys;

    // Initialize the session with the wallet's data.
    this.put('username', wallet.mainData.username);
    this.put('signingKeys', signingKeys);
    this.put('address', signingKeys.address);

    // Store a user object for the currently authenticated user
    UserPrivateInfo.load(this.get('username'), this.get('wallet').keychainData.updateToken)
      .then(function (user) {
        self.put('userPrivateInfo', user);
      })
      .then(function () {
        $rootScope.$broadcast('userLoaded');
      });

    // check for the most up to date fairy address
    checkFairyAddress.bind(this)();
    $rootScope.account = {};
    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});
    StellarNetwork.init();

    // Set loggedIn to be true to signify that it is safe to use the session variables.
    this.put('loggedIn', true);
  };

  Session.prototype.rememberUser = function() {
    try {
      localStorage.rememberUser = true;
    } catch (err) {}
  };

  Session.prototype.isPersistent = function() {
    var rememberUser;
    try {
      rememberUser = JSON.parse(localStorage.rememberUser);
    } catch (err) {}

    return Options.PERSISTENT_SESSION || rememberUser;
  };

  Session.prototype.syncWallet = function(action) {
    var wallet = this.get('wallet');

    return wallet.sync(action)
      .then(function() {
        if (this.isPersistent()) {
          wallet.saveLocal();
        }
      }.bind(this));
  };

  Session.prototype.getWalletFromStorage = function($scope) {
    try {
       return Wallet.loadLocal();
    } catch(e) {
      Wallet.purgeLocal();
      throw e;
    }
  };

  Session.prototype.logout = function(idle) {
    try {
      sessionStorage.displayReloadMessage = false;
      localStorage.rememberUser = false;
    } catch (e) {}

    Wallet.purgeLocal();

    // HACK: Ensure that the app's state is reset by reloading the page.
    if (Options.LOGOUT_WITH_REFRESH) {
      if(idle) {
        location.search = 'idle';
      } else {
        location.href = location.origin;
      }
    } else {
      cache = {};
      delete $rootScope.account;
      StellarNetwork.shutdown();
      this.clearIdleTimeout();
    }
  };

  Session.prototype.getUser = function () {
    return this.get('userPrivateInfo');
  };

  function checkFairyAddress() {
    $http.get(Options.API_SERVER + "/fairy")
    .success(function (response) {
      var federationRecord = response.data.federation_json;
      contacts.addContact(federationRecord);
    });
  }

  return new Session();
});
