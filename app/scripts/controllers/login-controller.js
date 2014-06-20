'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, $http, $timeout, session) {
  if(session.get('loggedIn')) {
    session.logOut();
  }

  $scope.username   = null;
  $scope.password   = null;
  $scope.loggingIn  = false;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    if($scope.loggingIn) {
      return;
    }
    
    $scope.loginError = null;
    $scope.loggingIn = true;

    deriveId()
      .then(performLogin)
      .finally(function() {
        $scope.loggingIn = false;
      });
  };


  function deriveId() {
    //TODO: actually make Wallet.deriveId Promiseable
    //HACK: use timeout to turn an expensive synchronous operation into a promise
    return  $timeout(function() {
              return Wallet.deriveId($scope.username, $scope.password);
            }, 0);
  }

  function performLogin(id) {
    return $http.post(Options.WALLET_SERVER + '/wallets/show', {id: id})
      .success(function(body) {
        try {
          var key    = Wallet.deriveKey(id, $scope.username, $scope.password);
          var wallet = Wallet.decrypt(body.data, id, key);

          session.login(wallet);
          $state.go('dashboard');
        } catch (err) {
          // Error decrypting blob.
          $scope.loginError = err.message;
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 404:
            $scope.loginError = 'Invalid username or password.';
            break;
          case 0:
            $scope.loginError = 'Unable to contact the server.';
            break;
          default:
            $scope.loginError = 'An error occurred.';
        }
      });
  }
});
