angular.module('stellarClient').controller('SettingsEmailCtrl', function($scope, $http, $q, session, singletonPromise) {

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
      return verifyEmail();
    }
  });

  function verifyEmail () {
    var verifyToken = $scope.verifyToken;
    return session.getUser().verifyEmail(verifyToken)
      .then(function (response) {
        if (response.data.data && response.data.data.serverRecoveryCode) {
          var userPartBytes = bs58.decode(verifyToken);
          var serverPartBytes = bs58.decode(response.data.data.serverRecoveryCode);
          var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
          return bs58.encode(fullRecoveryCodeBytes);
        } else {
          return $q.reject();
        }
      })
      .then(function(fullRecoveryCode) {
        var wallet = session.get('wallet');
        return wallet.walletV2.enableRecovery({
          recoveryCode: fullRecoveryCode,
          secretKey: wallet.keychainData.signingKeys.secretKey
        });
      })
      .then(function () {
        return $scope.$parent.refreshAndInitialize();
      })
      .then(function () {
        $scope.verifyToken = null;
      })
      .catch(StellarWallet.errors.ConnectionError, function(e) {
        Util.showTooltip($('#verify-input'), 'Error connecting wallet server.', 'error', 'top');
      })
      .catch($scope.$parent.handleServerError($('#verify-input')))
      .finally(function() {
        $scope.$apply();
      });
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
