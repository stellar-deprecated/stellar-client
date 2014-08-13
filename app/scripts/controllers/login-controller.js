'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($rootScope, $scope, $state, $http, $timeout, $q, session, singletonPromise, Wallet, FlashMessages, $translate) {
  $scope.username   = null;
  $scope.password   = null;
  $scope.rememberMe = false;
  $scope.loginError = null;

  // HACK: Perform AJAX login, but send a POST request to a hidden iframe to
  // coax Chrome into offering to remember the password.
  $scope.attemptLogin = function() {
    $scope.asyncLogin();
    return true;
  };

  $scope.asyncLogin = singletonPromise(function() {
    $scope.loginError = null;
    if (!$scope.username || !$scope.password) {
      return $q.reject($translate.instant('login.username_password_cannot_be_blank'));
    }
    return deriveId().then(performLogin);
  });

  if (location.search.match('idle')) {
    $translate(['login.you_have_been_logged_out', 'login.logout_security'])
      .then(function(translations) {
        FlashMessages.add({
          title: translations['login.you_have_been_logged_out'],
          info: translations['login.logout_security'],
          type: 'error'
        });
      });
  }
  if ($rootScope.recoveringUsername) {
    $rootScope.recoveringUsername = false;
    $translate(['login.username_emailed', 'login.username_emailed_check_inbox'])
      .then(function(translations) {
        FlashMessages.add({
          title: translations['login.username_emailed'],
          info: translations['login.username_emailed_check_inbox'],
          type: 'info'
        });
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
            $state.go('dashboard');
          });
      })
      .error(function(body, status) {
        switch(status) {
          case 404:
            $scope.loginError = $translate.instant('login.invalid_username_or_password');
            break;
          case 0:
            $scope.loginError = $translate.instant('login.unable_to_contact_server');
            break;
          default:
            $scope.loginError = $translate.instant('login.error_occurred');
        }
      });
  }

  $translate(['login.logout', 'login.logout_refreshed'])
    .then(function(translations) {
      if (sessionStorage['display_reload_message'] === "display") {
        try {
          sessionStorage['display_reload_message'] = false;
        } catch (e) {}
        FlashMessages.add({
          title: translations['login.logout'],
          info: translations['login.logout_refreshed'],
          type: 'error'
        });
      }
    });
});
