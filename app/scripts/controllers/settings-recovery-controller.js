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
  $scope.recoveryCode = null;

  function enableRecovery() {
    $scope.enabling = true;
    wallet.enableRecovery({
      secretKey: session.get('wallet').keychainData.signingKeys.secretKey
    }).then(function(code) {
      recoveryCode = code;
      $scope.recoveryCode = code; // Temp
      if (session.isPersistent()) {
        session.get('wallet').saveLocal(); // We need to rewrite wallet object because lockVersion has changed
      }
    }).finally(function() {
      $scope.$apply();
    }); // TODO handle errors
  }

  $scope.confirmEnableRecovery = function($event) {
    $event.preventDefault();
    if ($scope.code === recoveryCode) {
      recoveryCode = null;
      $scope.enabling = false;
      $scope.$emit('settings-recovery-toggled', true);
    } else {
      $scope.error = 'Incorrect recovery code. Please try again.';
    }
  };
});