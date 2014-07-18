sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, $http, session) {
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

    activateEmail()
      .then(storeRecoveryData)
      .finally(function(){
        $scope.loading = false;
      });
  };

  function activateEmail(){
    var data = {
      recoveryCode: $scope.emailActivationCode,
      username: session.get('username')
    };

    return $http.post(Options.API_SERVER + '/claim/verifyEmail', data)
      .success(function(response) {
        serverRecoveryCode = response.data.serverRecoveryCode;
        $rootScope.$broadcast('emailVerified', response.message);
      })
      .error(function(response) {
        if (response && response.status == 'fail') {
          if (response.code == 'validation_error') {
            var error = response.data;
            if (error.code == "invalid") {
              $scope.errors.push("Invalid code.");
            } else {
              // TODO: invalid credentials, send to login page?
              $scope.errors.push('Please login again.');
            }
          } else if (response.code == 'already_claimed') {
            // TODO: this user has already claimed the verify_email reward
          }
        } else {
          $scope.errors.push('An error occured.');
        }
      });
  }

  function storeRecoveryData(){
    var userRecoveryCode = $scope.emailActivationCode;
    var recoveryId = Wallet.deriveId(userRecoveryCode, serverRecoveryCode);
    var recoveryKey = Wallet.deriveKey(recoveryId, userRecoveryCode, serverRecoveryCode);

    var data = wallet.createRecoveryData(recoveryId, recoveryKey);

    return $http.post(Options.WALLET_SERVER + '/wallets/create_recovery_data', data);
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
