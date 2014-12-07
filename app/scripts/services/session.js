'use strict';
/* global loadSiftScript */

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http, $timeout, $q, StellarNetwork, Wallet, contacts, UserPrivateInfo, FlashMessages) {
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
    }, this.get('wallet').getIdleLogoutTime());
  };

  Session.prototype.clearIdleTimeout = function() {
    if (this.idleTimeout) {
      $timeout.cancel(this.idleTimeout);
    }
  };

  Session.prototype.login = function(wallet, logoutOnLegacyWallet) {
    try {
      sessionStorage.displayReloadMessage = "display";
    } catch (e) {}

    // User has persisted old wallet. Logout so he can migrate to new version.
    if (logoutOnLegacyWallet && wallet.version !== 2) {
      this.logout();
      return;
    }

    this.put('wallet', wallet);

    // Wait until the username is know to start sift science analytics.
    loadSiftScript(wallet.mainData.username);

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

    this.loadUserPrivateData();
    this.identifyToAnalytics();

    // check for the most up to date fairy address
    checkFairyAddress.bind(this)();
    $rootScope.account = {};
    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});
    StellarNetwork.ensureConnection();

    // Set loggedIn to be true to signify that it is safe to use the session variables.
    this.put('loggedIn', true);
  };

  var userLoadedPromise;
  // Unfortunately $q API doesn't provide a way to check if a promise is finished (resolved/rejected).
  var userLoadedPromiseFinished = false;
  Session.prototype.loadUserPrivateData = function() {
    // Promise is waiting or is resolved.
    if ((userLoadedPromise && !userLoadedPromiseFinished) || this.get('userPrivateInfo')) {
      return userLoadedPromise.promise;
    }

    var self = this;
    userLoadedPromise = $q.defer();
    userLoadedPromiseFinished = false;
    FlashMessages.dismissById('user-data-loading-failed');

    // Store a user object for the currently authenticated user
    UserPrivateInfo.load(self.get('username'), self.get('wallet').keychainData.updateToken)
      .then(function (user) {
        self.put('userPrivateInfo', user);
        $rootScope.userLoaded = true; // Used in templates
        $rootScope.$broadcast('userLoaded');
        userLoadedPromise.resolve();
      })
      .then(function () {
        self.identifyToAnalytics();
      })
      .catch(function() {
        FlashMessages.add({
          id: 'user-data-loading-failed',
          type: 'error',
          template: 'templates/flash-message-user-data-loading-failed.html',
          showCloseIcon: false,
          global: true
        });
        userLoadedPromise.reject();
      })
      .finally(function() {
        userLoadedPromiseFinished = true;
      });

    return userLoadedPromise.promise;
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

  Session.prototype.identifyToAnalytics = function() {
      window.analytics.identify(this.get('username'), this.getAnalyticsTraits());
  };

  Session.prototype.getAnalyticsTraits = function() {
    var traits      = {};
    traits.username = this.get("username");
    
    var privateInfo = this.get("userPrivateInfo");
    
    if(!_.isEmpty(privateInfo)) {
      traits.invites           = privateInfo.invites.length;
      traits.inviteCode        = privateInfo.inviteCode;
      traits.inviterUsername   = privateInfo.inviterUsername;
      traits.claimedInviteCode = privateInfo.claimedInviteCode;
      traits.linkedFacebook    = privateInfo.linkedFacebook;

      if(privateInfo.email) {
        traits.email = privateInfo.email.address;
      }
    }



    return traits;
  };

  function checkFairyAddress() {
    /*jshint camelcase: false */
    $http.get(Options.API_SERVER + "/fairy")
    .success(function (response) {
      var federationRecord = response.data.federation_json;
      contacts.addContact(federationRecord);
    });
  }

  return new Session();
});
