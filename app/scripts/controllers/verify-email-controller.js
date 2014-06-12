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
      success: verifyEmailSuccess
    }).done(verifyEmailDone)
      .error(verifyEmailError);

    function verifyEmailSuccess(response) {
      $scope.$apply(function(){
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
      });
    }

    function verifyEmailDone() {
      $scope.$apply(function() {
        $scope.loading = false;
      });
    }

    function verifyEmailError() {
      $scope.$apply(function() {
        $scope.loading = false;
        $scope.errors.push('An error occurred.');
      });
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
