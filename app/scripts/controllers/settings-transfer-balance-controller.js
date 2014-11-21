'use strict';

/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('TransferBalanceCtrl', function($scope, $rootScope, $q, StellarNetwork, session, singletonPromise, contacts, Gateways) {
  $scope.reset = function () {
    $scope.transferDestination = '';
    $scope.state = 'closed';
  };

  $scope.reset();

  $scope.$on('settings-refresh', $scope.reset);

  $scope.openForm = function () {
    $scope.state = 'open';
  };

  $scope.confirmTransfer = function () {
    $scope.state = 'confirm';
  };

  $scope.accountEmpty = function() {
    return !$scope.account.Account;
  };

  $scope.transferBalance = singletonPromise(function() {
    return getAddress($scope.transferDestination)
      .then(function(address) {
        var tx = $scope.mergeAccount(address);
        var deferred = $q.defer();

        tx.on('success', deferred.resolve);
        tx.on('error', deferred.reject);

        return deferred.promise.catch(function(err) {
          return $q.reject(err.engine_result_message);
        });
      })
      .then(function (result) {
        Gateways.markAllRemoved();
        $scope.reset();
      })
      .catch(function(err) {
        $scope.state = 'open';

        // Construct an error for handleServerError.
        $scope.handleServerError($('#account-merge-input'))({
          data: {
            status: 'fail',
            message: err || 'Server error'
          }
        });
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

  $scope.mergeAccount = function(destinationAddress) {
    var tx = StellarNetwork.remote.transaction();
    tx.accountMerge($scope.account.Account, destinationAddress);

    tx.submit();

    return tx;
  };
});