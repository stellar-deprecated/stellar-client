'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, session) {
  if(session.get('loggedIn')) session.logOut();

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    // Store the credentials needed to encrypt and decrypt the blob.
    session.storeCredentials($scope.username, $scope.password);

    // Initialize the session variables.
    session.start();

    // Encrypt the blob and send it to the server.
    session.storeBlob();
    // end TEMP

    $scope.$broadcast('$idAccountLoad', {account: blob.get('packedKeys').address, secret: blob.get('packedKeys').secret});
    $state.go('dashboard');

    // TODO: waiting for Wallet server
    $.ajax({
      method: 'GET',
      url: Options.WALLET_SERVER + '/wallets/show',
      dataType: 'json',
      success: function(data, status, xhr){
        $scope.$apply(function() {
          if (status == 'success') {
            try {
              var wallet = Wallet.decrypt(data, $scope.username, $scope.password);

              session.put('wallet', wallet);
              session.start();

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
  };
});
