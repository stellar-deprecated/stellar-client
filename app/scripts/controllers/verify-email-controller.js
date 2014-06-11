sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, session) {
  $scope.email = session.get('blob').get('email');
  $scope.loading = false;
  $scope.errors = [];

  $scope.verifyEmail = function() {
    if(!$scope.emailActivationCode) {
      return;
    }

    $scope.loading = true;
    $scope.errors = [];

    var data = {
      recoveryCode: $scope.emailActivationCode,
      username: session.get('username')
    };

    $.ajax({
      type: 'POST',
      url: Options.API_SERVER + '/claim/verifyEmail',
      dataType: 'JSON',
      data: data,
      success: $scope.$apply(verifyEmailSuccess)
    }).done($scope.$apply(verifyEmailDone))
      .error($scope.$apply(verifyEmailError));

    function verifyEmailSuccess(response) {
      switch (response.status) {
        case 'success':
          $rootScope.$broadcast('emailVerified');
          break;
        case 'fail':
          switch (response.code) {
            case 'validation_error':
              // TODO: invalid credentials, send to login page?
              verifyEmailError();
              break;
            case 'facebook_auth':
              // TODO: let the user know their reward is waiting, but they need to facebook auth first
              break;
          }
          break;
        case 'error':
          verifyEmailError();
          break;
      }
    }

    function verifyEmailDone() {
      $scope.loading = false;
    }

    function verifyEmailError() {
      $scope.loading = false;
      $scope.errors.push('An error occurred.');
    }
  };

  $scope.clear = function() {
    $scope.emailActivationCode = '';
    $scope.loading = false;
  };

  $scope.cancel = function() {
    $scope.clear();
    $scope.closeReward();
  };
});
