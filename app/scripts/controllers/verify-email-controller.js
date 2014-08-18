sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, $http, $state, session, Wallet) {
  var wallet = session.get('wallet');
  $scope.email = wallet.mainData.email;
  $scope.loading = false;
  $scope.errors = [];

  var serverRecoveryCode = null;

  $scope.verifyEmail = function() {
    if(!$scope.emailActivationCode) {
      return;
    }

    $scope.loading = true;
    $scope.errors = [];

    verifyEmail()
      .then(function () {
         $scope.updateRewards();
      })
      .then(function () {
        wallet.storeRecoveryData($scope.emailActivationCode, serverRecoveryCode);
      })
      .finally(function(){
        $scope.loading = false;
      });
  };

  function verifyEmail() {
    var data = {
      recoveryCode: $scope.emailActivationCode,
      username: session.get('username'),
      updateToken: wallet.keychainData.updateToken
    };

    return $http.post(Options.API_SERVER + '/user/verifyEmail', data)
      .success(function(response) {
        serverRecoveryCode = response.data.serverRecoveryCode;
      })
      .error(function(response) {
        if (response && response.status == 'fail') {
          switch (response.code) {
            case 'invalid_update_token':
              // this user's update token is invalid, send to login
              $state.transitionTo('login');
              break;
            case 'invalid':
              if (response.data && response.data.field == 'recovery_code') {
                $scope.errors.push('Invalid recovery code.');
              }
              break;
          }
        }
      });
  }

  $scope.clear = function() {
    $scope.emailActivationCode = '';
    $scope.loading = false;
  };

  $scope.back = function() {
    $scope.clear();
    $scope.reward.status = 'incomplete';
  };
});
