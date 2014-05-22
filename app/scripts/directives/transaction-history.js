'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', ['$scope', 'stNetwork', 'ngTableParams', '$filter', function( $scope, $network, ngTableParams, $filter)
{
  $scope.typeIcons = {
    'sent': 'glyphicon glyphicon-upload',
    'received': 'glyphicon glyphicon-download'
  };

  $scope.tableParams = new ngTableParams({
    page: 1,
    count: 10,
    sorting: {
      date: 'asc'
    }
  }, {
    total: ($scope.history || []).length,
    getData: function($defer, params) {
      var transactions = ($scope.history || []);
      var data = params.sorting() ? $filter('orderBy')(transactions, params.orderBy()) : transactions;
      $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
    }
  });
}]);
