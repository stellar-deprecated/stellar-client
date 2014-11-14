angular.module('stellarClient').controller('SettingsEmailCtrl', function($scope, $http, $state, $q, session, singletonPromise) {
  var wallet = session.get('wallet');

  $scope.$on('settings-refresh', function () {
    $scope.email = session.getUser().getEmailAddress();
    $scope.emailVerified = session.getUser().isEmailVerified();
    $scope.verifyToken = null;
    $scope.resetEmailState();
  });

  $scope.resetEmailState = function () {
    if ($scope.email) {
      $scope.emailState = 'added';
    } else {
      $scope.emailState = 'none';
    }
  };

  $scope.getEmailState = function () {
    return $scope.emailState;
  };

  $scope.setEmailState = function (state) {
    $scope.emailState = state;
  };

  $scope.emailAction = singletonPromise(function () {
    if ($scope.emailState === 'change') {
      return changeEmail();
    } else if ($scope.emailState === 'verify') {
      if ($scope.$parent.hasRecovery) {
        return verifyEmail()
          .catch($scope.handleServerError($('#verify-input')));
      } else {
        return getServerRecoveryCode($scope.verifyToken)
          .then(enableRecovery)
          .then(verifyEmail)
          .catch(StellarWallet.errors.ConnectionError, function(e) {
            Util.showTooltip($('#verify-input'), 'Error connecting wallet server.', 'error', 'top');
          })
          .catch($scope.$parent.handleServerError($('#verify-input')))
          .finally(function() {
            $scope.$apply();
          });
      }
    }
  });

  function getServerRecoveryCode(userRecoveryCode) {
    var data = {
      userRecoveryCode: userRecoveryCode,
      username:         session.get('username'),
      updateToken:      wallet.keychainData.updateToken
    };

    return $http.post(Options.API_SERVER + '/user/getServerRecoveryCode', data)
      .success(function (response) {
        return response.serverRecoveryCode;
      })
      .error(failedServerResponse);
  }

  function enableRecovery(response) {
    var userPartBytes = bs58.decode($scope.verifyToken);
    var serverPartBytes = bs58.decode(response.data.serverRecoveryCode);
    var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
    var fullRecoveryCode = bs58.encode(fullRecoveryCodeBytes);

    return wallet.walletV2.enableRecovery({
      recoveryCode: fullRecoveryCode,
      secretKey: wallet.keychainData.signingKeys.secretKey
    });
  }

  function verifyEmail () {
    return session.getUser().verifyEmail($scope.verifyToken)
      .then(function () {
        return $scope.$parent.refreshAndInitialize();
      })
      // We need to reload settings because `recover` setting is set to `false` if there is no recovery code.
      .then($scope.$parent.getSettings)
      .then(function () {
        $scope.verifyToken = null;
      });
  }

  function failedServerResponse(response) {
    if (!response){
      Util.showTooltip($('#verify-input'), 'Server error', 'error', 'top');
      return $q.reject();
    }

    if (response.status !== 'fail'){
      Util.showTooltip($('#verify-input'), 'Unexpected status: ' + response.status, 'error', 'top');
      return $q.reject();
    }

    switch (response.code) {
      case 'invalid_update_token':
        // this user's update token is invalid, send to login
        $state.transitionTo('login');
        break;
      case 'invalid':
        if (response.data && response.data.field === 'recovery_code') {
          Util.showTooltip($('#verify-input'), 'Invalid recovery code.', 'error', 'top');
        }
    }

    return $q.reject();
  }

  function changeEmail () {
    return session.getUser().changeEmail($scope.newEmail)
      .then(function () {
        return $scope.$parent.refreshAndInitialize();
      })
      .then(function () {
        $scope.newEmail = null;
      })
      .catch($scope.$parent.handleServerError($('#email-input')));
  }
});
