'use strict';

angular.module('stellarClient').controller('SettingsRecoveryCtrl', function($scope, session) {
  var wallet = session.get('wallet').walletV2;

  $scope.reset = function () {
    $scope.error = null;
    $scope.enabling = false;
    $scope.code = null;
  };
  $scope.reset();
  $scope.$on('settings-refresh', $scope.reset);

  $scope.$on('settings-recovery-clicked', function($event, toggle) {
    if (toggle.on) {
      disableRecovery();
    } else {
      enableRecovery();
    }
  });

  function disableRecovery() {
    $scope.enabling = false;
    $scope.$emit('settings-recovery-toggled', false);
  }

  var recoveryCode = null;
  $scope.recoveryCode = null; // Temp

  function enableRecovery() {
    $scope.enabling = true;
    recoveryCode = StellarWallet.util.generateRandomRecoveryCode();
    $scope.recoveryCode = recoveryCode; // temp
  }

  $scope.confirmEnableRecovery = function($event) {
    $event.preventDefault();
    if ($scope.code === recoveryCode) {
      wallet.enableRecovery({
        secretKey: session.get('wallet').keychainData.signingKeys.secretKey,
        recoveryCode: $scope.code
      }).then(function() {
        recoveryCode = null;
        $scope.code = null;
        $scope.recoveryCode = null; // Temp
        $scope.enabling = false;
        $scope.$emit('settings-recovery-toggled', true);
        if (session.isPersistent()) {
          session.get('wallet').saveLocal(); // We need to rewrite wallet object because lockVersion has changed
        }
      }).finally(function() {
        $scope.$apply();
      }); // TODO handle errors
    } else {
      $scope.error = 'Incorrect recovery code. Please try again.';
    }
  };
});