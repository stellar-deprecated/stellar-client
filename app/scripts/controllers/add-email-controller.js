var sc = angular.module('stellarClient');
/* global addEmailForm */

sc.controller('AddEmailCtrl', function ($scope, $rootScope, $http, $state, session) {
  $scope.loading = false;
  $scope.errors = [];

  $scope.addEmail = function() {
    if (addEmailForm.email.value) {
      $scope.loading = true;
      $scope.errors = [];

      if (!$scope.email) {
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
    }
    
    
    function addEmailSuccess(response) {
      // Store the email address in the wallet.
      wallet.mainData.email = $scope.email;
      session.syncWallet('update');

      // Switch to the verify overlay.
      $scope.rewards[2].status = "unverified";

      return session.getUser().refresh();
    }

    function addEmailError(response) {
      if (response && response.status === 'fail') {
        switch (response.code) {
          case 'invalid_update_token':
            // this user's update token is invalid, send to login
            $state.transitionTo('login');
            break;
          case 'already_taken':
            $scope.errors.push("This email is already taken.");
            break;
          default:
            $scope.errors.push("Server error.");
        }
      } else {
        $scope.errors.push("Server error.");
      }
      $scope.loading = false;
    }

    function addEmailDone() {
      $scope.loading = false;
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
