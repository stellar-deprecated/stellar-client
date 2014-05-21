'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, session, DataBlob, KeyGen) {
  if(session.get('loggedIn')) session.logOut();

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    session.storeCredentials($scope.username, $scope.password);

      // TEMP till the backend works
      var keys = KeyGen.generateKeys();
      var packedKeys = KeyGen.pack(keys);


      // TODO: Don't spoof the address.
      packedKeys.address = 'gHb9CJAWyB4gj91VRWn96DkukG4bwdtyTh';
      packedKeys.secret = 'snoPBgXtMeMyMHUVTrbuqAfr1SUTb';

      var blob = new DataBlob();
      blob.put('username', $scope.username);
      blob.put('packedKeys', packedKeys);
      blob.put('updateToken', '2');
      blob.put('walletAuthToken', 'temp');

      // Set the default client configuration
      blob.put('server', Options.server);

      // Save the new blob to the session
      session.put('blob', blob);

      // Store the credentials needed to encrypt and decrypt the blob.
      session.storeCredentials($scope.username, $scope.password);

      // Initialize the session variables.
      session.start();

      // Encrypt the blob and send it to the server.
      session.storeBlob();
      // end TEMP

      $scope.$broadcast('$idAccountLoad', {account: blob.get('packedKeys').address, secret: blob.get('packedKeys').secret});
      $state.go('dashboard');

      /* TODO: waiting for Wallet server
    $.ajax({
      method: 'GET',
      url: Options.WALLET_SERVER + '/fetchBlob/' + session.get('blobID'),
      dataType: 'json',
      success: function(data, status, xhr){
        $scope.$apply(function() {
          if (data) {
            try {
              var blob = new DataBlob();
              blob.decrypt(data.blob, session.get('blobKey'));

              session.put('blob', blob);
              session.start();

              $scope.$broadcast('$idAccountLoad', {account: blob.get('packedKeys').address, secret: blob.get('packedKeys').secret});

              $state.go('dashboard');
            } catch (err) {
              // Error decrypting blob.
              $scope.loginError = err;
            }
          } else {
            // No blob found.
            $scope.loginError = 'Invalid username or password.';
          }
        });
      },
      error: function(){
        $scope.$apply(function() {
          // Request failed.
          $scope.loginError = 'Unable to contact the server.';
        });
      }
    });
    */
  };
});
