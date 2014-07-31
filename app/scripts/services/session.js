'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope, $http, $timeout, stNetwork, Wallet) {
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

    var wallet = this.get('wallet');
    if (wallet) {
      wallet.bumpLocalTimeout();
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

  Session.prototype.login = function(wallet) {
    sessionStorage['display_reload_message'] = "display";

    this.put('wallet', wallet);

    if (Options.PERSISTENT_SESSION) {
      wallet.saveLocal();
    }

    var signingKeys = wallet.keychainData.signingKeys;

    // Initialize the session with the wallet's data.
    this.put('username', wallet.mainData.username);
    this.put('signingKeys', signingKeys);
    this.put('address', signingKeys.address);

    // check for the most up to date fairy address
    checkFairyAddress.bind(this)();
    $rootScope.account = {}
    $rootScope.$broadcast('walletAddressLoaded', {account: signingKeys.address, secret: signingKeys.secret});
    stNetwork.init();

    this.setIdleTimeout();
    // Set loggedIn to be true to signify that it is safe to use the session variables.
    this.put('loggedIn', true);
  };

  Session.prototype.loginFromStorage = function($scope) {
    try {
       var wallet = Wallet.loadLocal()

      if (wallet) {
        this.login(wallet);
      }
    } catch(e) {
      Wallet.purgeLocal();
      throw e;
    }
  };

  Session.prototype.logout = function() {
    sessionStorage['display_reload_message'] = false;

    Wallet.purgeLocal();
    cache = {};
    delete $rootScope.account;
    stNetwork.shutdown();
    this.clearIdleTimeout();

    // HACK: Ensure that the app's state is reset by reloading the page.
    if (Options.LOGOUT_WITH_REFRESH) {
      location.reload();
    }
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
        wallet.sync('update');
      }
    });
  }

  return new Session();
});