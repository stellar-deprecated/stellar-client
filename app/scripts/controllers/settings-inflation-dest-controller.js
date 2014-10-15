'use strict';

/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('SettingsInflationDestCtrl', function($scope, $q, session, singletonPromise, contacts) {
  $scope.reset = function () {
    $scope.inflationDest = $scope.account.InflationDest;
    if ($scope.inflationDest) {
        contacts.fetchContactByAddress($scope.inflationDest);
    }
    $scope.newInflationDest = '';
    $scope.changing = false;
  };

  $scope.reset();

  $scope.$on('settings-refresh', $scope.reset);

  $scope.change = function () {
    $scope.changing = true;
  };

  $scope.canPayFee = function() {
    return $scope.account.max_spend && $scope.account.max_spend.to_number() > 0;
  };

  $scope.update = singletonPromise(function() {
    return getAddress($scope.newInflationDest)
      .then(function(address) {
        var tx = $scope.setInflationDest(address);
        var deferred = $q.defer();

        tx.on('success', deferred.resolve);
        tx.on('error', deferred.reject);

        return deferred.promise;
      })
      .then(function () {
        $scope.reset();
      })
      .catch($scope.handleServerError($('#inflation-dest-input')));
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
          // Construct an error for handleServerError.
          return $q.reject({
            status: 'fail',
            message: 'Invalid account'
          });
        });
    }
  }
});