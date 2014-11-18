var sc = angular.module('stellarClient');

sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, $http, $state, $analytics, $q, session, stellarApi) {
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
      .catch(function(e) {
        var error;
        if (e === 'invalid_recovery_code') {
          error = 'Invalid recovery code.';
        } else if (e === 'server_error') {
          error = 'Server error.';
        } else if (e.name === 'ConnectionError') {
          error = 'Connection Error. Please try again.';
        } else {
          error = 'Unknown error. Please try again.';
          // TODO add logging
        }
        $scope.errors.push(error);
      })
      .finally(function(){
        $scope.loading = false;
      });
  };

  function getServerRecoveryCode(userRecoveryCode) {
    var deferred = $q.defer();

    var data = {
      userRecoveryCode: userRecoveryCode,
      username:         session.get('username'),
      updateToken:      wallet.keychainData.updateToken
    };

    stellarApi.User.getServerRecoveryCode(data)
      .success(function (response) {
        deferred.resolve(response);
      })
      .error(function(body) {
        var error;
        if (!body) {
          error = "server_error";
        } else {
          switch (body.code) {
            case 'invalid_update_token':
              // this user's update token is invalid, send to login
              $state.transitionTo('login');
              break;
            case 'invalid':
              if (body.data && body.data.field === 'recovery_code') {
                error = 'invalid_recovery_code';
              }
          }
        }
        deferred.reject(error);
      });

    return deferred.promise;
  }

  function enableRecovery(response) {
    var userPartBytes = bs58.decode($scope.emailActivationCode);
    var serverPartBytes = bs58.decode(response.serverRecoveryCode);
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
