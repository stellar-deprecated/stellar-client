'use strict';

angular.module('stellarClient').controller('LoginV2Ctrl', function($scope, $state, $stateParams, $q, singletonPromise, Wallet, session) {
  setTimeout(function() {
    angular.element('#password')[0].focus();
  }, 200);

  $scope.totpRequired = $stateParams.totpRequired;

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
      username: $stateParams.username,
      password: $scope.password
    };

    if ($scope.totpRequired) {
      params = _.extend(params, {
        totpCode: $scope.totpCode
      });
    }

    return StellarWallet.getWallet(params).then(function(wallet) {
      session.login(new Wallet({
        version: 2,
        id: "d3d1944ba4b183173ada93dcb765e8fc23f24990ff9b2ebed8acd21cf6763b92",
        key: "f2f6ed37f70e0b7c9e93121da259ae08c91a072c2fd5b4bc7567602a00c61cfd",
        keychainData: wallet.getKeychainData(),
        mainData: wallet.getMainData(),
        walletV2: wallet
      }));
      $state.go('dashboard');
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.loginError = "Password or TOTP code incorrect.";
    }).catch(StellarWallet.errors.TotpCodeRequired, function() {
      $scope.loginError = "2-Factor-Authentication code is required to login.";
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.loginError = "Error connecting wallet server.";
    }).catch(StellarWallet.errors.UnknownError, function() {
      $scope.loginError = "Unknown error.";
    }).catch(function(e) {
      console.error(e);
      $scope.loginError = "Unknown error.";
    });
  });
});