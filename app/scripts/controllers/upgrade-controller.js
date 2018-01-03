'use strict';

/*global StellarBase */

angular.module('stellarClient').controller('UpgradeCtrl', function($scope, $sce, session, stellarApi, upgradeMessage) {
  $scope.balance = null;
  $scope.view = 'loading';

  var keys = session.get('signingKeys');

  $scope.upgrade = function() {
    $scope.view = 'upgrading';
    var message = upgradeMessage(keys, $scope.newNetworkAddress);
    message.code = $scope.confirmationCode;
    stellarApi.Upgrade.upgrade(message)
      .success(function() {
        $scope.view = 'upgraded';
      })
      .error(function(response){
        $scope.view = 'intro';
        var error;
        switch(response && response.code) {
          case 'maintenance':
            error = 'Maintenance. Please try again later.';
            break;
          case 'contact_support':
            error = 'Please contact support: hello@stellar.org';
            break;
          case 'account_blocked':
            error = 'Your account has been blocked from upgrading because it looks like you created multiple accounts while only one account per person was allowed.';
            break;
          case 'no_confirmation_code':
            error = 'Confirmation code has been sent to your email address added to your Stellar account. Please copy it in the form below.';
            $scope.showConfirmationCodeInput = true;
            break;
          case 'invalid_confirmation_code':
            error = 'Invalid confirmation code. Please try again.';
            break;
          case 'not_found':
            error = 'Account contains 0 STR. Create a <a href="https://www.stellar.org/developers/guides/concepts/accounts.html" target="_blank">new account on the upgraded network</a>.';
            break;
          case 'invalid_address':
            error = 'Invalid address. Contact <a href="mailto:support@stellar.org">support@stellar.org</a>.';
            break;
          case 'already_claimed':
            error = 'Account already upgraded. To sign in, go to the <a href="https://www.stellar.org/account-viewer/" target="_blank">account viewer</a>.';
            break;
          case 'balance_too_low':
            error = 'Account has less than 20 STR. To upgrade, use the <a href="https://github.com/stellar/stellar-upgrade/releases" target="_blank">command line tool</a>.';
            break;
          case 'invalid_signature':
            error = 'Invalid signature. Contact <a href="mailto:support@stellar.org">support@stellar.org</a>.';
            break;
          default:
            error = 'Couldn\'t upgrade. Please try again in a moment.';
        }

        $scope.error = $sce.trustAsHtml(error);
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
        var keypair = StellarBase.Keypair.random();
        $scope.newNetworkSecretSeed = keypair.seed();
        $scope.newNetworkAddress = keypair.accountId();
        $scope.have_keys = true;
      } else {
        $scope.view = 'upgraded';
        if (response.have_keys) {
          var keypair = StellarBase.Keypair.fromBase58Seed(keys.secret);
          $scope.newNetworkSecretSeed = keypair.seed();
          $scope.newNetworkAddress = keypair.accountId();
          $scope.have_keys = true;
        }
      }
      $scope.balance = response.str_balance;
      $scope.balances = response.balances;
    })
    .error(function(response){
      $scope.view = 'intro';
      var error;
      switch(response && response.code) {
        case 'not_found':
          error = 'Account contains 0 STR. Create a <a href="https://www.stellar.org/developers/guides/concepts/accounts.html" target="_blank">new account on the upgraded network</a>.';
          break;
        default:
          error = 'An error occurred.';
      }
      $scope.error = $sce.trustAsHtml(error);
    });
});
