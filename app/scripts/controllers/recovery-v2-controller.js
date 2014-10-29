'use strict';

angular.module('stellarClient').controller('RecoveryV2Ctrl', function($scope, $state, $q, $http, singletonPromise, debounce) {
  $scope.username = null;
  $scope.totpRequired = false;
  $scope.recoveryCode = null;
  $scope.recoveryError = null;
  $scope.usernameError = null;

  $scope.checkTotpRequired = debounce(1000, function() {
    $scope.usernameError = null;

    if (_.isEmpty($scope.username)) {
      return;
    }

    $scope.usernameClass = 'glyphicon-refresh spin';
    var username = $scope.username + '@stellar.org';

    $http.post(Options.WALLET_SERVER + '/v2/wallets/show_login_params', {
      username: username
    }).success(function(response) {
      $scope.totpRequired = response.totpRequired;
    }).error(function(body, status) {
      $scope.usernameError = "Invalid username.";
    }).finally(function() {
      $scope.usernameClass = 'glyphicon-none';
    });
  });

  $scope.attemptRecovery = singletonPromise(function() {
    var params = {
      username: $scope.username,
      recoveryCode: $scope.recoveryCode
    };

    return $q.when(params)
      .then(validate)
      .then(recover)
      .then(function (params) {
        $state.go('change_password_v2', {
          username: params.username,
          masterKey: params.masterKey,
          totpRequired: $scope.totpRequired
        });
      });
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

  function recover(params) {
    var deferred = $q.defer();

    var data = {
      server: Options.WALLET_SERVER+'/v2',
      username: params.username,
      recoveryCode: params.recoveryCode
    };

    if ($scope.totpRequired) {
      data.totpCode = $scope.totpCode;
    }

    StellarWallet.recover(data).then(function(masterKey) {
      params.masterKey = masterKey;
      deferred.resolve(params);
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.usernameError = "Invalid username or recovery code.";
      deferred.reject();
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.usernameError = "Error connecting wallet server. Please try again later.";
      deferred.reject();
    }).catch(function(e) {
      $scope.usernameError = "Unknown error. Please try again later.";
      deferred.reject();
    }).finally(function() {
      $scope.$apply();
    });

    return deferred.promise;
  }
});
