'use strict';

angular.module('stellarClient').controller('SettingsTotpCtrl', function($scope, session) {
  var wallet = session.get('wallet').walletV2;

  $scope.reset = function () {
    $scope.error = null;
    $scope.enabling = false;
    $scope.code = null;
    $scope.password = null;
    $scope.disabling = false;
  };
  $scope.reset();
  $scope.$on('settings-refresh', $scope.reset);

  var key;

  $scope.$on('settings-totp-clicked', function($event, toggle) {
    if (toggle.on) {
      disableTotp();
    } else {
      enableTotp();
    }
  });

  function enableTotp() {
    $scope.enabling = true;
    key = StellarWallet.util.generateRandomTotpKey();
    // Partition string into 4 chars segments
    $scope.key = key.match(/.{4}/g).join(' ');
    $scope.uri = StellarWallet.util.generateTotpUri(key, {
      issuer: 'Stellar Development Foundation',
      accountName: session.get('username')
    });
  }

  $scope.confirmEnableTotp = function($event) {
    $event.preventDefault();
    $scope.error = null;

    wallet.enableTotp({
      totpKey: key,
      totpCode: $scope.code,
      secretKey: session.get('wallet').keychainData.signingKeys.secretKey
    }).then(function() {
      $scope.enabling = false;
      $scope.code = null;
      $scope.$emit('settings-totp-toggled', true);
      if (session.isPersistent()) {
        session.get('wallet').saveLocal(); // We need to rewrite wallet object because isTotpEnabled var changed
      }
    }).catch(StellarWallet.errors.MissingField, function() {
      $scope.error = 'Please enter a code.';
    }).catch(StellarWallet.errors.InvalidTotpCode, function() {
      $scope.error = 'Invalid code.';
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.error = 'Connection error. Please try again.';
    }).catch(StellarWallet.errors.UnknownError, function() {
      $scope.error = 'Unknown error. Please try again.';
    }).finally(function() {
      $scope.$apply();
    });
  };

  function disableTotp() {
    $scope.disabling = true;
  }

  $scope.confirmDisableTotp = function($event) {
    $event.preventDefault();
    $scope.error = null;

    var params = {
      server: Options.WALLET_SERVER+'/v2',
      username: wallet.getUsername(),
      password: $scope.password,
      totpCode: $scope.code
    };

    StellarWallet.getWallet(params).then(function() {
      return wallet.disableTotp({
        totpCode: $scope.code,
        secretKey: session.get('wallet').keychainData.signingKeys.secretKey
      });
    }).then(function() {
      $scope.disabling = false;
      $scope.code = null;
      $scope.password = null;
      $scope.$emit('settings-totp-toggled', false);
      if (session.isPersistent()) {
        session.get('wallet').saveLocal(); // We need to rewrite wallet object because isTotpEnabled var changed
      }
    }).catch(StellarWallet.errors.Forbidden,
             StellarWallet.errors.TotpCodeRequired,
             StellarWallet.errors.InvalidTotpCode,
             StellarWallet.errors.MissingField, function() {
      $scope.error = "Password or TOTP code incorrect.";
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.error = 'Connection error. Please try again.';
    }).catch(StellarWallet.errors.UnknownError, function() {
      $scope.error = 'Unknown error. Please try again.';
    }).finally(function() {
      $scope.$apply();
    });
  };
});