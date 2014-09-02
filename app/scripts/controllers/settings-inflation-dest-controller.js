'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsInflationDestCtrl', function($scope, $q, session, singletonPromise, contacts, stNetwork) {
  $scope.inflationDest = $scope.account.InflationDest;
  $scope.newInflationDest = '';
  $scope.changing = false;

  $scope.$on('settings-refresh', $scope.reset);

  $scope.reset = function () {
    $scope.inflationDest = $scope.account.InflationDest;
    $scope.newInflationDest = '';
    $scope.changing = false;
  };

  $scope.change = function () {
    $scope.changing = true;
  };

  $scope.canPayFee = function() {
    return $scope.account.max_spend && $scope.account.max_spend.to_number() > 0;
  };

  $scope.update = singletonPromise(function() {
    return getAddress($scope.newInflationDest)
      .then(setInflationDest)
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

  function setInflationDest(address) {
    var deferred = $q.defer();

    var tx = stNetwork.remote.transaction();
    tx.accountSet(session.get('address'));
    tx.inflationDest(address);

    tx.on('success', deferred.resolve);
    tx.on('error', deferred.reject);

    tx.submit();

    return deferred.promise;
  }
});