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
