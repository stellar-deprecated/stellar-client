'use strict';

angular.module('stellarClient').controller('LoginCtrl', function($rootScope, $scope, $state, $http, $timeout, $q, session, singletonPromise, FlashMessages) {
  $scope.username   = null;
  $scope.loginError = null;

  // HACK: Perform AJAX login, but send a POST request to a hidden iframe to
  // coax Chrome into offering to remember the password.
  $scope.attemptLogin = function() {
    $scope.asyncLogin();
    return true;
  };

  $scope.asyncLogin = singletonPromise(function() {
    $scope.loginError = null;

    if (!$scope.username) {
      $scope.loginError = "Username and password cannot be blank.";
      return $q.reject();
    }

    var usernameV2 = $scope.username+'@stellar.org';

    return $http.post(Options.WALLET_SERVER + '/v2/wallets/show_login_params', {
        username: usernameV2
      }).success(function(response) {
        $state.go('login_v2', {
          username: usernameV2,
          totpRequired: response.totpRequired
        });
      }).error(function(body, status) {
        switch(status) {
          case 404:
            $state.go('login_v1', {username: $scope.username});
            break;
          case 0:
            $scope.loginError = 'Unable to contact the server.';
            break;
          default:
            $scope.loginError = 'An error occurred.';
        }
      });
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

  if (sessionStorage.displayReloadMessage === "display") {
    try {
      sessionStorage.displayReloadMessage = false;
    } catch (e) {}
    FlashMessages.add({
      title: 'Logout',
      info: 'You refreshed the page, which unfortunately means you\'ll have to sign in again. This is necessary because your password (used to access your account) is kept locally in your browser tab and never sent to our servers.',
      type: 'error'
    });
  }

  if(window.analytics && window.analytics.reset) {
    window.analytics.reset();
  }
});
