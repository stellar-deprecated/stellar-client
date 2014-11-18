'use strict';

angular.module('stellarClient').controller('Lost2FADeviceCtrl', function($scope, singletonPromise) {
  $scope.error = null;
  $scope.sent = false;

  $scope.sendRequest = function($event) {
    $event.preventDefault();
    $scope.asyncRequest();
  };

  $scope.asyncRequest = singletonPromise(function() {
    $scope.error = null;

    StellarWallet.lostTotpDevice({
      server: Options.WALLET_SERVER+'/v2',
      username: $scope.username+'@stellar.org',
      password: $scope.password
    }).then(function() {
      $scope.sent = true;
    }).catch(StellarWallet.errors.WalletNotFound, function() {
      $scope.sent = true;
    }).catch(StellarWallet.errors.MissingField, function() {
      $scope.error = 'Please fill in all fields.';
    }).catch(StellarWallet.errors.ConnectionError, function() {
      $scope.error = 'Problems connecting wallet server. Please try again later.';
    }).catch(function(e) {
      $scope.error = 'Unknown error. Please try again later.';
    });
  });
});
