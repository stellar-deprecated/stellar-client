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
        success: $scope.$apply(addEmailSuccess)
      }).done($scope.$apply(addEmailDone))
        .error($scope.$apply(addEmailError));

      function addEmailSuccess(response) {
        switch (response.status) {
          case 'success':
            // Store the email address in the blob.
            session.get('blob').put('email', $scope.email);
            session.storeBlob();

            // Switch to the verify overlay.
            $rootScope.emailToVerify = $scope.email;
            break;
          case 'fail':
            switch (response.code) {
              case 'validation_error':
                var error = response.data;
                if (error.field == "update_token" && error.code == "invalid") {
                    // TODO: invalid update token error
                    addEmailError();
                }
                break;
            }
            break;
          case 'error':
            addEmailError();
        }



        if (response.error) {
          response.status = 'error';
        }

        switch (response.status) {
          case 'success':

          case 'error':
            $scope.errors.push('Invalid email address');
          case 'default':
            break;
        }
      }

      function addEmailDone() {
        $scope.loading = false;
      }

      function addEmailError() {
        $scope.loading = false;
        $scope.errors.push('An error occurred.');
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
