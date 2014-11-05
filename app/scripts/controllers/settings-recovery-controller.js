'use strict';

angular.module('stellarClient').controller('SettingsRecoveryCtrl', function($scope, $http, session, stellarApi, UserPrivateInfo, FlashMessages) {
  var wallet = session.get('wallet');
  var params = {
    username: session.get('username'),
    updateToken: wallet.keychainData.updateToken
  };

  var userRecoveryCode = null;
  var serverRecoveryCode = null;

  $scope.reset = function () {
    $scope.error = null;
    $scope.resetting = false;
    $scope.sendingRecoveryCode = false;
    $scope.code = null;

    stellarApi.User.getNewRecoveryCode(params)
      .then(function(response) {
        if (response.data.status === 'success') {
          $scope.resetting = true;
          userRecoveryCode = response.data.userRecoveryCode;
          serverRecoveryCode = response.data.serverRecoveryCode;
        } else {
          $scope.resetting = false;
        }
      });
  };
  $scope.reset();
  $scope.$on('settings-refresh', $scope.reset);

  $scope.$on('settings-recovery-clicked', function($event, toggle) {
    toggleRecovery(!toggle.on);
  });

  function toggleRecovery(value) {
    $http.post(Options.API_SERVER+'/user/setrecover', _.extend(params, {
      recover: value
    })).success(function () {
      $scope.$emit('settings-recovery-toggled', value);
    }).error(function () {
      FlashMessages.add({
        title: 'Server error',
        info: 'There was an error contacting server. Please try again later.',
        type: 'error'
      });
    });
  }

  $scope.resetRecovery = function($event) {
    $event.preventDefault();
    $scope.sendingRecoveryCode = true;

    stellarApi.User.changeRecoveryToken(params)
     .success(function() {
        stellarApi.User.getNewRecoveryCode(params)
          .then(function(response) {
            if (response.data.status === 'success') {
              $scope.resetting = true;
              userRecoveryCode = response.data.userRecoveryCode;
              serverRecoveryCode = response.data.serverRecoveryCode;
            }
          });
     }).error(function (response){
        $scope.resetting = false;
        if (response.code === 'no_email') {
          FlashMessages.add({
            title: 'No email added',
            info: 'Add and verify your email first. Recovery token will be sent to your email inbox.'
          });
        } else {
          FlashMessages.add({
            title: 'Recovery Error',
            info: 'There was error trying to generate recovery token. Please try again later.',
            type: 'error'
          });
        }
     }).finally(function() {
        $scope.sendingRecoveryCode = false;
     });
  };

  $scope.confirmResetRecovery = function($event) {
    $event.preventDefault();

    if ($scope.code !== userRecoveryCode) {
      $scope.error = 'Incorrect recovery code. Please try again.';
      return;
    }

    var userPartBytes = bs58.decode($scope.code);
    var serverPartBytes = bs58.decode(serverRecoveryCode);
    var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
    var fullRecoveryCode = bs58.encode(fullRecoveryCodeBytes);
    wallet.walletV2.enableRecovery({
      recoveryCode: fullRecoveryCode,
      secretKey: wallet.keychainData.signingKeys.secretKey
    }).then(function() {
      return stellarApi.User.finishChangeRecoveryToken(_.extend(params, {
        userRecoveryCode: $scope.code
      }));
    }).then(function() {
      $scope.code = null;
      $scope.resetting = false;
      FlashMessages.add({
        title: 'Success',
        info: 'Your recovery token has been reset!'
      });
      if (session.isPersistent()) {
        session.get('wallet').saveLocal(); // We need to rewrite wallet object because lockVersion has changed
      }
    }).catch(StellarWallet.errors.ConnectionError, function(e) {
      $scope.error = 'Connection error. Please try again.';
    }).catch(function(e) {
      $scope.error = 'Unknown error. Please try again.';
      // TODO add logging
    }).finally(function() {
      $scope.$apply();
    });
  };

  $scope.cancelResetRecovery = function($event) {
    $event.preventDefault();

    stellarApi.User.cancelChangingRecoveryCode(params)
      .success(function() {
        $scope.resetting = false;
      }).error(function() {
        $scope.error = 'Cannot cancel changing recovery code now. Please try again.';
      });
  };
});