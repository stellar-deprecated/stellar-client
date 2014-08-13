'use strict';

var sc = angular.module('stellarClient');

sc.controller('RecoveryCtrl', function($scope, $state, $http, $timeout, session, Wallet, $translate) {
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
      $scope.recoveryError = $translate.instant('recovery.enter_recovery_code');
    }
    if (!$scope.username) {
      $scope.usernameError = $translate.instant('recovery.enter_username');
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
          $scope.recoveryError = $translate.instant('recovery.error_occurred');
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 400:
            if (body.code == 'invalid') {
              $scope.recoveryError = $translate.instant('recovery.invalid_username_or_code');
            } else if (body.code == 'disabled') {
              $scope.recoveryError = $translate.instant('recovery.recovery_disabled_for_account');
            }
            break;
          case 0:
            $scope.recoveryError = 'Unable to contact the server.';
            break;
          default:
            $scope.recoveryError = $translate.instant('recovery.error_occurred');
        }
      });
  }

  function deriveRecoveryId(){
    //TODO: actually make Wallet.deriveId Promiseable
    //HACK: use timeout to turn an expensive synchronous operation into a promise
    return  $timeout(function() {
      return Wallet.deriveId($scope.userRecoveryCode, $scope.serverRecoveryCode);
    }, 0);
  }

  function recoverWallet(recoveryId){
    var data = {recoveryId: recoveryId};

    return $http.post(Options.WALLET_SERVER + '/wallets/recover', data)
      .success(function(body) {
        if (body.data) {
          var wallet = Wallet.recover(body.data, recoveryId, $scope.userRecoveryCode, $scope.serverRecoveryCode);

          session.login(wallet);
          $state.go('change_password');
        } else {
          $scope.recoveryError = $translate.instant('recovery.error_occurred');
        }
      })
      .error(function(body, status) {
        switch(status) {
          case 404:
            $scope.recoveryError = $translate.instant('recovery.invalid_recovery_id');
            break;
          case 0:
            $scope.recoveryError = $translate.instant('recovery.unable_to_contact_server');
            break;
          default:
            $scope.recoveryError = $translate.instant('recovery.error_occurred');
        }
      });
  }
});
