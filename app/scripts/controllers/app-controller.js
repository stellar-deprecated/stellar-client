'use strict';

var sc = angular.module('stellarClient');

sc.factory('session', function($cacheFactory){
  // A place to store session information that will persist until the user leaves the page.
  return $cacheFactory('session');
});

sc.controller('AppCtrl', function($scope) {

});

sc.controller('NavCtrl', function($scope, session) {
  // The session is initially not logged in.
  session.put('loggedIn',  false);

  // Allow the nav to access the session variables.
  $scope.session = session;
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
