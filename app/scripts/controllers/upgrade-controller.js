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
            $scope.error = 'Couldn\'t locate account. Contact <a href="mailto:support@stellar.org">support@stellar.org</a>.';
            break;
          case 'invalid_address':
            $scope.error = 'Invalid address. Contact <a href="mailto:support@stellar.org">support@stellar.org</a>.';
            break;
          case 'already_claimed':
            $scope.error = 'Account already upgraded. To sign in, go to the <a href="https://www.stellar.org/account-viewer/" target="_blank">account viewer</a>.';
            break;
          case 'balance_too_low':
            $scope.error = 'Account has less than 20 STR. To upgrade, use the <a href="https://github.com/stellar/stellar-upgrade/releases" target="_blank">command line tool</a>.';
            break;
          case 'invalid_signature':
            $scope.error = 'Invalid signature. Contact <a href="mailto:support@stellar.org">support@stellar.org</a>.';
            break;
          default:
            $scope.error = 'Couldn\'t upgrade. Please try again in a moment.';
        }
      });
  };

  $scope.reveal = function($event) {
    $event.preventDefault();
    $scope.revealSecret = true;
  };

  stellarApi.Upgrade.balance({address: session.get('address')})
    .success(function(response) {
      /*jshint camelcase: false */
      if (!response.claimed) {
        $scope.view = 'intro';
      } else {
        $scope.view = 'upgraded';
      }
      $scope.balance = response.str_balance;
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
