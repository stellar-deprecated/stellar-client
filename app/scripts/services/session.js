'use strict';

var sc = angular.module('stellarClient');

var cache = {};

sc.service('session', function($rootScope) {
  var Session = function() {};

  Session.prototype.get = function(name){ return cache[name]; };
  Session.prototype.put = function(name, value){ return cache[name] =  value; };

  Session.prototype.storeCredentials = function(username, password){
    // Store the username and password in the session cache.
    this.put('username', username);
    this.put('password', password);
  };

  // TODO: Think about moving this.
  Session.prototype.storeWallet = function(encryptedWallet, username, password) {
    if (Options.PERSISTENT_SESSION) {
      localStorage.wallet = JSON.stringify(encryptedWallet);
      localStorage.username = username || localStorage.username;
      localStorage.password = password || localStorage.password;
    }
  };

  Session.prototype.start = function(username, signingKeys) {
    // Initialize the session with the blob's data.
    this.put('username', username);
    this.put('keys', signingKeys);
    this.put('address', signingKeys.address);

    $rootScope.$broadcast('$idAccountLoad', {account: signingKeys.address, secret: signingKeys.secretKey});

    // Set loggedIn to be true to signify that it is safe to use the session variables.
    this.put('loggedIn', true);
  };

  Session.prototype.loginFromStorage = function($scope) {
    var encryptedWallet = JSON.parse(localStorage.wallet);
    var username = localStorage.username;
    var password = localStorage.password;

    if (encryptedWallet && username && password) {
      var wallet = Wallet.decrypt(encryptedWallet, username, password);

      this.put('wallet', wallet);
      this.put('username', username);
      this.put('password', password);
      this.put('loggedIn', true);

      this.start(username, wallet.keychainData.signingKeys);
    }
  };

  Session.prototype.logOut = function() {
    cache.removeAll();

    if (Options.PERSISTENT_SESSION){
      delete localStorage.wallet;
      delete localStorage.username;
      delete localStorage.password;
    }

    this.put('loggedIn', false);
  };

  return new Session();
});