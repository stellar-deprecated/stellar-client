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
      if (response.error) {
        response.status = 'error';
      }

      switch(response.status) {
        case 'success':
          $rootScope.$broadcast('emailVerified');
          break;
        case 'error':
          $scope.errors.push('Invalid verification code.');
          break;
        case 'default':
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
