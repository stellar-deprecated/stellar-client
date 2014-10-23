'use strict';

angular.module('stellarClient').controller('RecoveryV2Ctrl', function($scope, $q, $http, singletonPromise) {
  $scope.username = null;
  $scope.recoveryCode = null;
  $scope.recoveryError = null;
  $scope.usernameError = null;
  $scope.attemptRecovery = singletonPromise(function() {
    var params = {
      username: $scope.username,
      recoveryCode: $scope.recoveryCode
    };

    return $q.when(params)
      .then(validate)
      .then(checkIfTotpEnabled)
      .then(recover);
  });

  function validate(params) {
    $scope.recoveryError = null;
    $scope.usernameError = null;

    if (!params.recoveryCode) {
      $scope.recoveryError = "Please enter your recovery code.";
    }
    if (!params.username) {
      $scope.usernameError = "Please enter your username.";
    }

    if ($scope.recoveryError || $scope.usernameError) {
      return $q.reject();
    }

    // Append suffix
    params.username = params.username+'@stellar.org';

    return params;
  }

  function checkIfTotpEnabled(params) {
    var deferred = $q.defer();

    $http.post(Options.WALLET_SERVER + '/v2/wallets/show_login_params', {
      username: params.username
    }).success(function(response) {
       params.totpRequired = response.totpRequired;
       deferred.resolve(params);
    }).error(function(body, status) {
       $scope.usernameError = "Invalid username or recovery code.";
       deferred.reject();
    });

    return deferred.promise;
  }

  function recover(params) {
    var deferred = $q.defer();

    StellarWallet.recover({
      server: Options.WALLET_SERVER+'/v2',
      username: params.username,
      recoveryKey: params.recoveryCode
    }).then(function(data) {
      console.log(data.walletId);
      console.log(data.walletKey);
      deferred.resolve(params);
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.usernameError = "Invalid username or recovery code.";
      deferred.reject();
    });

    return deferred.promise;
  }
});
