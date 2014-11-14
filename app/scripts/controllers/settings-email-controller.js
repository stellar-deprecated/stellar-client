angular.module('stellarClient').controller('SettingsEmailCtrl', function($scope, $http, $state, $q, session, singletonPromise) {

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
      return verifyEmail().catch($scope.$parent.handleServerError($('#verify-input')));
    }
  });


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