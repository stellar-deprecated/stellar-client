sc.controller('AddEmailCtrl', function ($scope, $rootScope, $http, session) {
  $scope.loading = false;
  $scope.errors = [];

  $scope.addEmail = function() {
    if ($scope.email) {
      $scope.loading = true;
      $scope.errors = [];

      if (!Util.validateEmail($scope.email)) {
        $scope.errors.push("Please enter a valid email.");
        $scope.loading = false;
        return;
      }
      var wallet = session.get('wallet');

      var data = {
        email: $scope.email,
        username: session.get('username'),
        updateToken: wallet.keychainData.updateToken
      };

      $http.post(Options.API_SERVER + '/user/email', data)
      .success(addEmailSuccess)
      .error(addEmailError)
      .finally(addEmailDone);

      function addEmailSuccess(response) {
        // Store the email address in the wallet.
        wallet.mainData.email = $scope.email;
        session.syncWallet(wallet, 'update');

        // Switch to the verify overlay.
        $scope.rewards[2].status = "unverified";
      }

      function addEmailError(response) {
        if (response && response.status == 'fail') {
          if (response.code == 'validation_error') {
            var error = response.data;
            if (error.field == "update_token" && error.code == "invalid") {
              // TODO: send them to login screen?
              $scope.errors.push('Login expired');
            }
          } else if (response.code == "already_taken") {
            $scope.errors.push("This email is already taken.");
          }
        } else {
          $scope.errors.push('An error occured');
        }
        $scope.loading = false;
      }

      function addEmailDone() {
        $scope.loading = false;
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
