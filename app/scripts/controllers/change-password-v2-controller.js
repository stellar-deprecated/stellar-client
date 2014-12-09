'use strict';

/* global StellarWallet */

angular.module('stellarClient').controller('ChangePasswordV2Ctrl', function($scope, $state, $stateParams, FlashMessages) {
  $scope.totpRequired = $stateParams.totpRequired;

  $scope.data = {
    username:             $stateParams.username,
    password:             '',
    passwordConfirmation: ''
  };

  $scope.status = {
    passwordValid:        null,
    passwordConfirmValid: null
  };

  $scope.errors = {
    usernameErrors:        [],
    passwordErrors:        [],
    passwordConfirmErrors: []
  };

  $scope.validators = [];

  $scope.loading = false;

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  function validateInput() {
    $scope.errors.usernameErrors = [];

    var validInput = true;

    $scope.validators.forEach(function(validator){
      validInput = validator() && validInput;
    });

    return validInput;
  }

  $scope.attemptPasswordChange = function() {
    if ($scope.loading) {
      return;
    }

    $scope.loading = true;

    if (!validateInput()) {
      $scope.loading = false;
      return;
    }

    var params = {
      server: Options.WALLET_SERVER+'/v2',
      username: $stateParams.username.toLowerCase(),
      masterKey: $stateParams.masterKey
    };

    if ($scope.totpRequired) {
      params.totpCode = $scope.data.totpCode;
    }

    StellarWallet.getWallet(params).then(function(wallet) {
      var keychainData = JSON.parse(wallet.getKeychainData());
      return wallet.changePassword({
        newPassword: $scope.data.password,
        secretKey: keychainData.signingKeys.secretKey
      }).then(function() {
        return wallet;
      });
    }).then(function(wallet) {
      var keychainData = JSON.parse(wallet.getKeychainData());
      return wallet.enableRecovery({
        recoveryCode: $stateParams.recoveryCode,
        secretKey: keychainData.signingKeys.secretKey
      });
    }).then(function() {
      FlashMessages.add({
        title: 'Password changed!',
        info: 'You wallet password has been changed. You can login now.'
      });
      $state.go('login');
    }).catch(StellarWallet.errors.Forbidden, function(e) {
      var errorMsg = 'Forbidden. ';
      if ($scope.totpRequired) {
        errorMsg += 'Are you sure 2FA code is correct?';
      }
      $scope.errors.usernameErrors.push(errorMsg);
    }).catch(StellarWallet.errors.ConnectionError, function(e) {
      $scope.errors.usernameErrors.push('Error connecting wallet server. Please try again later.');
    }).catch(function(e) {
      Raven.captureMessage('StellarWallet.getWallet/StellarWallet.changePassword unknown error', {
        extra: {
          error: e
        }
      });
      $scope.errors.usernameErrors.push('Unknown error. Please try again later.');
    }).finally(function() {
      $scope.loading = false;
      $scope.$apply();
    });
  };
});
