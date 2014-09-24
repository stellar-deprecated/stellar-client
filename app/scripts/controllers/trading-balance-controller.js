'use strict';

var sc = angular.module('stellarClient');

sc.controller('TradingBalanceCtrl', function($scope, $rootScope, $filter, AccountLines) {
  $scope.accountLines = [];

  $scope.getCurrencyBalance = function(currency) {
    if (currency.currency === 'STR') {
      return $rootScope.balance / 1000000;
    }

    var accountLine = _.find($scope.accountLines, {
      'currency': currency.currency,
      'account': currency.issuer
    });

    if (accountLine) {
      return accountLine.balance;
    } else {
      return 0;
    }
  };

  function getAccountLines() {
    AccountLines.get()
      .then(function(accountLines) {
        $scope.accountLines = accountLines;
      });
  }

  $scope.$on('AccountLines:update', function(event, accountLines) {
      $scope.accountLines = accountLines;
  });

  getAccountLines();
});