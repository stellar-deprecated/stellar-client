'use strict';

var sc = angular.module('stellarClient');

sc.controller('TradingBalanceCtrl', function($scope, $rootScope, $filter, Balances) {
  $scope.baseBalance = null;
  $scope.counterBalance = null;

  $scope.balancesLoaded = false;

  $scope.$on('balances:update', function(event, accountLines) {
    refreshBalances();
  });

  function refreshBalances() {
    if (!Balances.areLoaded()) {
      return;
    }

    $scope.baseBalance = Balances.get($scope.formData.baseCurrency);
    $scope.counterBalance = Balances.get($scope.formData.counterCurrency);
    $scope.balancesLoaded = true;
  }

  Balances.ensureBalancesLoaded()
    .then(refreshBalances);

  $scope.$watch('formData.baseCurrency', refreshBalances, true);
  $scope.$watch('formData.counterCurrency', refreshBalances, true);
});