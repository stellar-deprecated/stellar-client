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
      .then(function (serverRecoveryCode) {
        return wallet.storeRecoveryData($scope.emailActivationCode, serverRecoveryCode)
          .catch(function (response) {
            failedServerResponse(response);

            return $q.reject();
          });
      })
      .then(function () {
        return verifyEmail();
      })
      .then(function () {
         $scope.updateRewards();
      })
      .finally(function(){
        $scope.loading = false;
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

  function verifyEmail() {
    var data = {
      token: $scope.emailActivationCode,
      username: session.get('username'),
      updateToken: wallet.keychainData.updateToken
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
