'use strict';

angular.module('stellarClient').controller('LoginV2Ctrl', function($scope, $state, $stateParams, $q, singletonPromise, Wallet, session) {
  setTimeout(function() {
    angular.element('#password')[0].focus();
  }, 200);

  $scope.totpRequired = $stateParams.totpRequired;

  $scope.goBack = function($event) {
    $event.preventDefault();
    $state.go('login');
  };

  // HACK: Perform AJAX login, but send a POST request to a hidden iframe to
  // coax Chrome into offering to remember the password.
  $scope.attemptLogin = function() {
    $scope.asyncLogin();
    return true;
  };

  $scope.asyncLogin = singletonPromise(function() {
    $scope.loginError = null;

    if (!$scope.password || ($scope.totpRequired && !$scope.totpCode)) {
      $scope.loginError = "Password ";
      if ($scope.totpRequired) {
        $scope.loginError += "and TOTP code ";
      }
      $scope.loginError += "cannot be blank.";
      return $q.reject();
    }

    var params = {
      server: Options.WALLET_SERVER+'/v2',
      username: $stateParams.username.toLowerCase(),
      password: $scope.password
    };

    if ($scope.totpRequired) {
      params = _.extend(params, {
        totpCode: $scope.totpCode
      });
    }

    // We don't have to run $scope.$apply because it's wrapped in singletonPromise
    return StellarWallet.getWallet(params).then(function(wallet) {
      if ($scope.rememberMe) {
        session.rememberUser();
      }

      session.login(new Wallet({
        version: 2,
        id: wallet.getWalletId(),
        key: wallet.getWalletKey(),
        keychainData: wallet.getKeychainData(),
        mainData: wallet.getMainData(),
        walletV2: wallet
      }));
      $state.go('dashboard');
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.loginError = "Login credentials are incorrect.";
    }).catch(StellarWallet.errors.TotpCodeRequired, function() {
      $scope.loginError = "2-Factor-Authentication code is required to login.";
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.loginError = "Error connecting wallet server. Please try again later.";
    }).catch(function(e) {
      Raven.captureMessage('StellarWallet.getWallet unknown error', {
        extra: {
          error: e
        }
      });
      $scope.loginError = "Unknown error.";
    });
  });
});