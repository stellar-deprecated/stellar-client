'use strict';

/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('DeleteAccountCtrl', function($scope, $rootScope, $q, StellarNetwork, stellarApi, session, singletonPromise, contacts, Gateways) {
  $scope.reset = function () {
    $scope.transferDestination = '';
    $scope.state = 'closed';
  };

  $scope.reset();

  $scope.$on('settings-refresh', $scope.reset);

  $scope.openForm = function () {
    $scope.state = 'open';
  };

  $scope.confirmDelete = function () {
    $scope.state = 'confirm';
  };

  $scope.accountEmpty = function() {
    return !$scope.account.Account;
  };

  $scope.deleteAccount = singletonPromise(function() {
    return mergeAccount()
      .then(deleteWallet)
      .then(deleteUser)
      .then(session.logout)
      .catch(function(err) {
        $scope.state = 'error';
      });
  });

  function getAddress(input) {
    if(stellar.UInt160.is_valid(input)) {
      // The input is an address.
      return $q.when(input);
    } else {
      return contacts.fetchContactByEmail(input)
        .then(function(result) {
          // Return the federated address.
          return result.destination_address;
        })
        .catch(function(err) {
          return $q.reject(err.engine_result_message);
        });
    }
  }

  function mergeAccount() {
    if($scope.accountEmpty()) {
      return $q.when();
    }

    return getAddress($scope.transferDestination)
      .then(function(destinationAddress) {
        var tx = StellarNetwork.remote.transaction();
        tx.accountMerge($scope.account.Account, destinationAddress);

        var promise = StellarNetwork.sendTransaction(tx);

        return promise.catch(function(err) {
          return $q.reject(err.engine_result_message);
        });
      });
  }

  function deleteUser() {
    var wallet = session.get('wallet');

    return stellarApi.User.delete({
      username:    session.get('username'),
      updateToken: wallet.keychainData.updateToken
    })
      .catch(function(err) {
        // Check if the error is caused by the user already being deleted.
        if(err.data.code !== 'invalid_update_token') {
          return $q.reject(err);
        }
      });
  }

  function deleteWallet() {
    var wallet = session.get('wallet');

    return wallet.walletV2.delete({secretKey: wallet.keychainData.signingKeys.secretKey})
      .catch(function(err) {
        // Check if the error is caused by the wallet already being deleted.
        if(err.name !== 'InvalidSignature') {
          return $q.reject(err);
        }
      });
  }
});