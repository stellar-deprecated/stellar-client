'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, $http, $timeout, $q, session, singletonPromise, Wallet, FlashMessages) {
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

  if(location.search.match('idle')) {
    FlashMessages.add({
      title: 'You\'ve been logged out',
      info: 'For your security, you have been logged out because your browser is idle. Please log back in to continue using Stellar.',
      type: 'error'
    });
  }

  function deriveId() {
    //TODO: actually make Wallet.deriveId Promiseable
    //HACK: use timeout to turn an expensive synchronous operation into a promise
    return  $timeout(function() {
              return Wallet.deriveId($scope.username, $scope.password);
            }, 25);
  }

  function performLogin(id) {
    return $http.post(Options.WALLET_SERVER + '/wallets/show', {id: id})
      .success(function(body) {
        Wallet.open(body.data, id, $scope.username, $scope.password)
          .then(function(wallet) {
            session.login(wallet);
            $state.go('dashboard');
          });
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

  if (sessionStorage['display_reload_message'] === "display") {
    try {
      sessionStorage['display_reload_message'] = false;
    } catch (e) {}
    FlashMessages.add({
      title: 'Logout',
      info: 'If you refresh you will be automatically logged out since it isn\'t safe to keep your password on disk.',
      type: 'error'
    });
  }
});
