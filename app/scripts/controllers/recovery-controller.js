'use strict';

var sc = angular.module('stellarClient');

sc.controller('RecoveryCtrl', function($scope, $state, $http, $timeout, session, Wallet) {
  $scope.username = null;
  $scope.userRecoveryCode = null;
  $scope.serverRecoveryCode = null;
  $scope.recovering = false;
  $scope.recoveryError = null;
  $scope.usernameError = null;
  $scope.attemptRecovery = function(){
    if($scope.recovering) {
      return;
    }

    if (!$scope.serverRecoveryCode) {
      $scope.recoveryError = "Please enter your recovery code.";
    }
    if (!$scope.username) {
      $scope.usernameError = "Please enter your username.";
    }

    if ($scope.recoverError || $scope.usernameError) {
      return;
    }

    $scope.recoveryError = null;
    $scope.usernameError = null;
    $scope.recovering = true;

    getServerRecoveryCode()
      .then(deriveRecoveryId)
      .then(recoverWallet)
      .finally(function() {
        $scope.recovering = false;
      });
  };

  function getServerRecoveryCode() {
    var data = {
      username: $scope.username,
      userRecoveryCode: $scope.userRecoveryCode
    };

    return $http.post(Options.API_SERVER + '/user/recover', data)
      .success(function(body) {
        if (body.data && body.data.serverRecoveryCode) {
          $scope.serverRecoveryCode = body.data.serverRecoveryCode;
        } else {
          $scope.recoveryError = 'An error occurred.';
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 400:
            if (body.code === 'invalid') {
              $scope.recoveryError = 'Invalid username or recovery code.';
            } else if (body.code === 'disabled') {
              $scope.recoveryError = 'Recovery has been disabled for this account.';
            }
            break;
          case 0:
            $scope.recoveryError = 'Unable to contact the server.';
            break;
          default:
            $scope.recoveryError = 'An error occurred.';
        }
      });
  }

  function deriveRecoveryId(){
    return Wallet.deriveId($scope.userRecoveryCode, $scope.serverRecoveryCode);
  }

  function recoverWallet(recoveryId){
    var data = {recoveryId: recoveryId};

    return $http.post(Options.WALLET_SERVER + '/wallets/recover', data)
      .success(function(body) {
        if (body.data) {
          var wallet = Wallet.recover(body.data, recoveryId, $scope.userRecoveryCode, $scope.serverRecoveryCode);

          session.login(wallet, false);
          $state.go('change_password');
        } else {
          $scope.recoveryError = 'An error occurred.';
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 404:
            $scope.recoveryError = 'Invalid recoveryId.';
            break;
          case 0:
            $scope.recoveryError = 'Unable to contact the server.';
            break;
          default:
            $scope.recoveryError = 'An error occurred.';
        }
      });
  }
});
