'use strict';

var sc = angular.module('stellarClient');

sc.controller('TradingBalanceCtrl', function($scope, $q, Balances) {
  $scope.baseBalance = null;
  $scope.counterBalance = null;

  $scope.balancesLoaded = false;

  $scope.$on('balances:update', function(event, accountLines) {
    refreshBalances();
  });

  function refreshBalances() {
    $q.all([
      Balances.get($scope.formData.baseCurrency),
      Balances.get($scope.formData.counterCurrency),
    ]).then(function(results) {

      $scope.baseBalance    = results[0];
      $scope.counterBalance = results[1];
      $scope.balancesLoaded = true;
    });
  }

  refreshBalances();
  $scope.$watch('formData.baseCurrency', refreshBalances, true);
  $scope.$watch('formData.counterCurrency', refreshBalances, true);
});