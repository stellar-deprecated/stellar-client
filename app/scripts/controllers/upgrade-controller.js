'use strict';

/*global StellarBase */

angular.module('stellarClient').controller('UpgradeCtrl', function($scope, session, stellarApi, upgradeMessage) {
  var keys = session.get('signingKeys');
  var keypair = StellarBase.Keypair.fromBase58Seed(keys.secret);

  $scope.newNetworkSecretSeed = keypair.seed();
  $scope.newNetworkAddress = keypair.address();
  $scope.balance = null;
  $scope.view = 'loading';

  $scope.upgrade = function() {
    $scope.view = 'upgrading';
    var message = upgradeMessage(keys, $scope.newNetworkAddress);
    stellarApi.Upgrade.upgrade(message)
      .success(function() {
        $scope.view = 'upgraded';
      })
      .error(function(response){
        $scope.view = 'intro';
        switch(response && response.code) {
          case 'not_found':
            $scope.error = 'We could not find your address.';
            break;
          case 'invalid_address':
            $scope.error = 'New network address is invalid.';
            break;
          case 'already_claimed':
            $scope.error = 'This address has been already claimed.';
            break;
          case 'invalid_signature':
            $scope.error = 'Signature is not valid.';
            break;
          default:
            $scope.error = 'An error occurred.';
        }
      });
  };

  stellarApi.Upgrade.balance({address: session.get('address')})
    .success(function(response) {
      /*jshint camelcase: false */
      if (!response.claimed) {
        $scope.view = 'intro';
      } else {
        $scope.view = 'upgraded';
      }
      $scope.balance = Math.floor(response.str_balance / 1000000);
    })
    .error(function(response){
      $scope.view = 'intro';
      switch(response && response.code) {
        case 'not_found':
          $scope.error = 'We could not find your address.';
          break;
        default:
          $scope.error = 'An error occurred.';
      }
    });
});
