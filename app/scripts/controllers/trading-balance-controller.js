'use strict';

var sc = angular.module('stellarClient');

sc.controller('TradingBalanceCtrl', function($scope, $q, Balances) {
  $scope.baseBalance = null;
  $scope.counterBalance = null;
  $scope.state = 'loading';

  $scope.$on('balances:update', function(event, accountLines) {
    refreshBalances();
  });

  function refreshBalances() {
    if (!$scope.formData.baseCurrency.currency || !$scope.formData.counterCurrency.currency) {
      $scope.state = 'pair-not-selected';
      return;
    } else {
      $scope.state = 'loading';
    }

    $q.all([
      Balances.get($scope.formData.baseCurrency),
      Balances.get($scope.formData.counterCurrency),
    ]).then(function(results) {
      $scope.baseBalance    = results[0];
      $scope.counterBalance = results[1];
      $scope.state = 'available';
    });
  }

  refreshBalances();
  $scope.$watch('formData.baseCurrency', refreshBalances, true);
  $scope.$watch('formData.counterCurrency', refreshBalances, true);
});