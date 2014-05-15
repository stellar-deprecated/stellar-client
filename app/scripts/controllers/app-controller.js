'use strict';

var sc = angular.module('stellarClient');

sc.controller('AppCtrl', function($scope) {

});

sc.factory('session', function($cacheFactory){
  // A place to store session information that will persist until the user leaves the page.
  return $cacheFactory('session');
});

sc.factory('storeCredentials', function(session, KeyGen){
  // Expand the user credentials into a key and an ID for the blob,
  // and save them to the session cache.
  return function(username, password){
    // Expand the user's credentials into the key used to encrypt the blob.
    var blobKey = KeyGen.expandCredentials(password, username);

    // Expand the user's credentials into the ID used to encrypt the blob.
    // The blobID must not allow an attacker to compute the blobKey.
    var blobID = sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(KeyGen.expandCredentials(password, blobKey)));

    // Store the username, key, and ID in the session cache.
    // Don't store the password since we no longer need it.
    session.put('username', username);
    session.put('blobKey', blobKey);
    session.put('blobID', blobID);
  };
});

sc.factory('connectToNetwork', function($rootScope, session){
  return function() {
    // Connect to the network.
    var server = session.get('blob').get('server');
    var network = new ripple.Remote(server, true);
    network.on('connected', function () {
      $rootScope.$broadcast('connected');
    });
    network.on('disconnected', function () {
      $rootScope.$broadcast('disconnected');
    });
    network.connect();

    // Store the network connection in the session.
    session.put('network', network);
  }
});

sc.service('updateBalance', function($rootScope, session){
  function requestBalance() {
    var network = session.get('network');
    network.request_account_info('gHb9CJAWyB4gj91VRWn96DkukG4bwdtyTh' /*session.get('address')*/)
      .on('success', function (data) {
        $rootScope.$apply(function(){
          $rootScope.balance = data.account_data.Balance / 1000000;
        });

        console.log('Account success: "' + JSON.stringify(data) + '"');
      })
      .on('error', function (data) {
        console.log('Account error: "' + JSON.stringify(data) + '"');
      })
      .request();
  }

  return function(){
    if(session.get('network')) requestBalance();
    else $rootScope.$on('connected', requestBalance);
  }
});

sc.factory('saveBlob', function(BLOB_LOCATION, session){
  return function() {
    // Get the blob from the session cache.
    var blob = session.get('blob');

    // Encrypt the blob and upload it to the server.
    $.ajax({
      url: BLOB_LOCATION + '/' + session.get('blobID'),
      method: 'POST',
      data: {blob: blob.encrypt(session.get('blobKey'))},
      dataType: 'json'
    });
  }
});

sc.service('loggedIn', function($state, session){
  return function(){
    // If the user is not logged in send them to the login page.
    if(!session.get('loggedIn') || !session.get('blob')){
      $state.go('login');
      return false;
    }

    return true;
  }
});
