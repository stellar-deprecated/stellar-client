'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($rootScope, $scope, $state, $http, $timeout, $q, session, singletonPromise, Wallet, FlashMessages, invites) {
  $scope.username   = null;
  $scope.password   = null;
  $scope.rememberMe = false;
  $scope.loginError = null;

  $scope.attemptLogin = singletonPromise(function() {
    $scope.loginError = null;
    if (!$scope.username || !$scope.password) {
      return $q.reject("Username or password cannot be blank");
    }
    return deriveId().then(performLogin);
  });

  if (location.search.match('idle')) {
    FlashMessages.add({
      title: 'You\'ve been logged out',
      info: 'For your security, you have been logged out because your browser is idle. Please log back in to continue using Stellar.',
      type: 'error'
    });
  }
  if ($rootScope.recoveringUsername) {
    $rootScope.recoveringUsername = false;
    FlashMessages.add({
      title: 'Username emailed',
      info: 'Your username has been emailed to you; please check your inbox.',
      type: 'info'
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
            if ($scope.rememberMe) {
              session.rememberUser();
            }
            session.login(wallet);

            if(session.get('inviteCode')) {
              invites.claim(session.get('inviteCode'));
            }

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
      info: 'You refreshed the page, which unfortunately means you\'ll have to sign in again. This is necessary because your password (used to access your account) is kept locally in your browser tab and never sent to our servers.',
      type: 'error'
    });
  }
});
