'use strict';

angular.module('stellarClient').controller('RecoveryV2Ctrl', function($scope, $state, $q, $http, singletonPromise, debounce, usernameHelper) {
  $scope.username = null;
  $scope.totpRequired = false;
  $scope.recoveryCode = null;
  $scope.recoveryError = null;
  $scope.usernameError = null;

  $scope.checkTotpRequired = debounce(function() {
    $scope.usernameError = null;

    if (_.isEmpty($scope.username)) {
      return;
    }

    $scope.usernameClass = 'glyphicon-refresh spin';

    $http.post(Options.WALLET_SERVER + '/v2/wallets/show_login_params', {
      username: usernameHelper.normalizeV2Username($scope.username)
    }).success(function(response) {
      $scope.totpRequired = response.totpRequired;
    }).error(function(body, status) {
      $scope.usernameError = "Invalid username.";
    }).finally(function() {
      $scope.usernameClass = 'glyphicon-none';
    });
  }, 1000);

  $scope.attemptRecovery = singletonPromise(function() {
    var params = {
      username: $scope.username,
      recoveryCode: $scope.recoveryCode
    };

    return $q.when(params)
      .then(validate)
      .then(getServerRecoveryCode)
      .then(recover)
      .then(function (params) {
        $state.go('change_password_v2', {
          username: params.username,
          masterKey: params.masterKey,
          recoveryCode: params.recoveryCode,
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

    return params;
  }

  function getServerRecoveryCode(params) {
    var deferred = $q.defer();

    var data = {
      username: params.username,
      userRecoveryCode: params.recoveryCode
    };

    $http.post(Options.API_SERVER + '/user/recover', data)
      .success(function(body) {
        if (body.data && body.data.serverRecoveryCode) {
          params.serverRecoveryCode = body.data.serverRecoveryCode;
          deferred.resolve(params);
        } else {
          $scope.recoveryError = 'An error occurred.';
          deferred.reject();
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 400:
            if (body.code === 'invalid') {
              $scope.recoveryError = 'Invalid username or recovery code.';
            } else if (body.code === 'disabled') {
              $scope.recoveryError = body.message;
            }
            break;
          case 0:
            $scope.recoveryError = 'Unable to contact the server.';
            break;
          default:
            $scope.recoveryError = 'An error occurred.';
        }
        deferred.reject();
      });

    return deferred.promise;
  }

  function recover(params) {
    var deferred = $q.defer();

    var userPartBytes = bs58.decode(params.recoveryCode);
    var serverPartBytes = bs58.decode(params.serverRecoveryCode);
    var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
    var fullRecoveryCode = bs58.encode(fullRecoveryCodeBytes);

    var data = {
      server: Options.WALLET_SERVER+'/v2',
      username: usernameHelper.normalizeV2Username(params.username),
      recoveryCode: fullRecoveryCode
    };

    if ($scope.totpRequired) {
      data.totpCode = $scope.totpCode;
    }

    StellarWallet.recover(data).then(function(masterKey) {
      params.masterKey = masterKey;
      params.recoveryCode = fullRecoveryCode;
      deferred.resolve(params);
    }).catch(StellarWallet.errors.Forbidden, function() {
      $scope.usernameError = "Invalid username or recovery code.";
      deferred.reject();
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.usernameError = "Error connecting wallet server. Please try again later.";
      deferred.reject();
    }).catch(function(e) {
      Raven.captureMessage('StellarWallet.recover unknown error', {
        extra: {
          error: e
        }
      });
      $scope.usernameError = "Unknown error. Please try again later.";
      deferred.reject();
    }).finally(function() {
      $scope.$apply();
    });

    return deferred.promise;
  }
});
