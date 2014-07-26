'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, $http, $timeout, $q, session, singletonPromise, Wallet) {
  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = singletonPromise(function() {
    $scope.loginError = null;
    if (!$scope.username || !$scope.password) {
      return $q.reject("Username or password cannot be blank");
    }
    return deriveId().then(performLogin);
  });

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
          $scope.loginError = 'An error occurred.';
          throw err;
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
