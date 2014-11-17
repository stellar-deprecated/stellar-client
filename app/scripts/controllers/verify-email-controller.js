var sc = angular.module('stellarClient');

sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, $http, $state, $analytics, $q, session, Wallet) {
  var wallet = session.get('wallet');

  $scope.email = wallet.mainData.email;
  $scope.loading = false;
  $scope.errors = [];


  $scope.verifyEmail = function() {
    if(!$scope.emailActivationCode) {
      return;
    }

    $scope.loading = true;
    $scope.errors = [];

    getServerRecoveryCode($scope.emailActivationCode)
      .then(enableRecovery)
      .then(verifyEmail)
      .then(function () {
         $scope.updateRewards();
      })
      .catch(StellarWallet.errors.ConnectionError, function(e) {
        $scope.errors.push('Error connecting wallet server.');
      })
      .finally(function(){
        $scope.loading = false;
        $scope.$apply();
      });
  };

  function getServerRecoveryCode(userRecoveryCode) {
    var data = {
      userRecoveryCode: userRecoveryCode,
      username:         session.get('username'),
      updateToken:      wallet.keychainData.updateToken
    };

    return $http.post(Options.API_SERVER + '/user/getServerRecoveryCode', data)
      .success(function (response) {
        return response.serverRecoveryCode;
      })
      .error(failedServerResponse);
  }

  function enableRecovery(response) {
    var userPartBytes = bs58.decode($scope.emailActivationCode);
    var serverPartBytes = bs58.decode(response.data.serverRecoveryCode);
    var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
    var fullRecoveryCode = bs58.encode(fullRecoveryCodeBytes);

    return wallet.walletV2.enableRecovery({
      recoveryCode: fullRecoveryCode,
      secretKey: wallet.keychainData.signingKeys.secretKey
    });
  }

  function verifyEmail() {
    var data = {
      token: $scope.emailActivationCode,
      username: session.get('username'),
      updateToken: wallet.keychainData.updateToken,
      recoveryCode: $scope.emailActivationCode
    };

    return $http.post(Options.API_SERVER + '/user/verifyEmail', data)
      .success(function(response) {
        return session.getUser().refresh().then(function() {
          session.identifyToAnalytics();
          $analytics.eventTrack("Email Verified");
        });
      })
      .error(failedServerResponse);
  }

  function failedServerResponse(response) {
    if (!response){ 
      $scope.errors.push('Server error'); 
      return $q.reject();
    }

    if (response.status !== 'fail'){ 
      $scope.errors.push('Unexpected status: ' + response.status); 
      return $q.reject();
    }

    switch (response.code) {
    case 'invalid_update_token':
      // this user's update token is invalid, send to login
      $state.transitionTo('login');
      break;
    case 'invalid':
      if (response.data && response.data.field === 'recovery_code') {
        $scope.errors.push('Invalid recovery code.');
      }
    }

    return $q.reject();
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
