'use strict';

var sc = angular.module('stellarClient');

sc.controller('TradingBalanceCtrl', function($scope, $q, Balances, singletonPromise) {
  $scope.baseBalance = null;
  $scope.counterBalance = null;

  $scope.$on('balances:update', function(event, accountLines) {
    $scope.refreshBalances();
  });

  $scope.refreshBalances = singletonPromise(function() {
    if (!$scope.pairSelected()) {
      return $q.when();
    }

    return $q.all([
      Balances.get($scope.formData.baseCurrency),
      Balances.get($scope.formData.counterCurrency),
    ]).then(function(results) {
      $scope.baseBalance    = results[0];
      $scope.counterBalance = results[1];
    });
  });

  $scope.pairSelected = function() {
    return $scope.formData.baseCurrency.currency && $scope.formData.counterCurrency.currency;
  };

  $scope.refreshBalances();
  $scope.$watch('formData.baseCurrency', $scope.refreshBalances, true);
  $scope.$watch('formData.counterCurrency', $scope.refreshBalances, true);
});