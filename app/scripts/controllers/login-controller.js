'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, session) {
  if(session.get('loggedIn')) session.logOut();

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    var id = Wallet.deriveId($scope.username, $scope.password);

    // TODO: waiting for Wallet server
    $.ajax({
      method: 'POST',
      url: Options.WALLET_SERVER + '/wallets/show',
      data: JSON.stringify({id: id}),
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      success: function(response, status, xhr){
        $scope.$apply(function() {
          if (status == 'success') {
            try {
              var key = Wallet.deriveKey(id, $scope.username, $scope.password);
              var wallet = Wallet.decrypt(response.data, id, key);

              session.login(wallet);

              $state.go('dashboard');
            } catch (err) {
              // Error decrypting blob.
              $scope.loginError = err.message;
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
