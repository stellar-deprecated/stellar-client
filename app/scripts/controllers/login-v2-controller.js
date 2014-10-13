'use strict';

angular.module('stellarClient').controller('LoginV2Ctrl', function($scope, $stateParams, $q, singletonPromise, Wallet) {
  $scope.totpRequired = $stateParams.totpRequired;

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
      var w = new Wallet({
        id: id,
        key: key,
        keychainData: wallet.keychainData,
        mainData: wallet.mainData
      });
      $state.go('dashboard');
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.loginError = "Password or TOTP code incorrect.";
    }).catch(StellarWallet.errors.TotpCodeRequired, function() {
      $scope.loginError = "TOTP code is required to login.";
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.loginError = "Error connecting wallet server.";
    }).catch(StellarWallet.errors.UnknownError, function() {
      $scope.loginError = "Unknown error.";
    });
  });
});