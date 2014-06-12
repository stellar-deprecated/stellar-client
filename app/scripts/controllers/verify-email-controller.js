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
      $rootScope.$broadcast('emailVerified');
    }

    function verifyEmailError (response) {
      if (response.status == 'fail') {
        if (response.code == 'validation_error') {
          // TODO: invalid credentials, send to login page?
          $scope.errors.push('Please login again.');
        } else if (response.code == 'facebook_auth') {
          // TODO: let the user know their reward is waiting, but they need to facebook auth first
          break;
        }
      } else {
        $scope.errors.push('An error occured.');
      }
      $scope.loading = false;
    }

    function verifyEmailDone() {
      $scope.loading = false;
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
