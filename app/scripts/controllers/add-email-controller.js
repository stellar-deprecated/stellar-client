sc.controller('AddEmailCtrl', function ($scope, $rootScope, session) {
  $scope.loading = false;
  $scope.errors = [];

  $scope.addEmail = function() {
    if ($scope.email) {
      $scope.loading = true;
      $scope.errors = [];

      var data = {
        email: $scope.email,
        username: session.get('username'),
        updateToken: session.get('blob').get('updateToken')
      };

      $.ajax({
        type: 'POST',
        url: Options.API_SERVER + '/user/email',
        dataType: 'JSON',
        data: data,
        success: addEmailSuccess
      }).done(addEmailDone)
        .error(addEmailError);

      function addEmailSuccess(response) {
        $scope.$apply(function() {
          // Store the email address in the blob.
          session.get('blob').put('email', $scope.email);
          session.storeBlob();

          // Switch to the verify overlay.
          $rootScope.emailToVerify = $scope.email;
        });
      }

      function addEmailError(response) {
        $scope.$apply(function() {
          var responseJSON = response.responseJSON;
          if (responseJSON && responseJSON.status == 'fail') {
            if (responseJSON.code == 'validation_error') {
              var error = responseJSON.data;
              if (error.field == "update_token" && error.code == "invalid") {
                // TODO: send them to login screen?
                $scope.errors.push('Login expired');
              }
            }
          } else {
            $scope.errors.push('An error occured');
          }
          $scope.loading = false;
        });
      }

      function addEmailDone() {
        $scope.$apply(function() {
          $scope.loading = false;
        });
      }
    }
  };

  $scope.clear = function() {
    $scope.email = '';
    $scope.loading = false;
  };

  $scope.cancel = function() {
    $scope.clear();
    $scope.closeReward();
  };
});
