sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, session) {
  $scope.email = session.get('wallet').mainData.email;
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
      $scope.$apply(function() {
        $rootScope.$broadcast('emailVerified', response.message);
      });
    }

    function verifyEmailError (response) {
      $scope.$apply(function() {
        var responseJSON = response.responseJSON;
        if (responseJSON && responseJSON.status == 'fail') {
          if (responseJSON.code == 'validation_error') {
            // TODO: invalid credentials, send to login page?
            $scope.errors.push('Please login again.');
          } else if (responseJSON.code == 'already_claimed') {
            // TODO: this user has already claimed the verify_email reward
          }
        } else {
          $scope.errors.push('An error occured.');
        }
        $scope.loading = false;
      });
    }

    function verifyEmailDone() {
      $scope.$apply(function() {
        $scope.loading = false;
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
