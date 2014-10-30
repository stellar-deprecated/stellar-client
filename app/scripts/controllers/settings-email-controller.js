angular.module('stellarClient').controller('SettingsEmailCtrl', function($scope, $http, session, singletonPromise) {

  $scope.$on('settings-refresh', function () {
    $scope.email = session.getUser().getEmailAddress();
    $scope.emailVerified = session.getUser().isEmailVerified();
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
    } else {
      return;
    }
  });

  function verifyEmail () {
    var verifyToken = $scope.verifyToken;
    return session.getUser().verifyEmail(verifyToken)
        .then(function (response) {
          if (response.data.data && response.data.data.serverRecoveryCode) {
            return session.get('wallet').storeRecoveryData(verifyToken, response.data.data.serverRecoveryCode);
          }
        })
        .then(function () {
          return $scope.refreshAndInitialize();
        })
        .then(function () {
          $scope.verifyToken = null;
        })
        .catch($scope.handleServerError($('#email-input')));
  }

  function changeEmail () {
    return session.getUser().changeEmail($scope.newEmail)
        .then(function () {
          return $scope.refreshAndInitialize();
        })
        .then(function () {
          $scope.newEmail = null;
        })
        .catch($scope.handleServerError($('#verify-input')));
  }
});
