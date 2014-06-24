'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', ['$scope', 'stNetwork', 'ngTableParams', '$filter', 'session', function( $scope, $network, ngTableParams, $filter, session)
{
  $scope.typeIcons = {
    'sent': 'glyphicon glyphicon-upload',
    'received': 'glyphicon glyphicon-download'
  };

  $scope.tableParams = new ngTableParams({
    page: 1,
    count: 10,
    sorting: {
      date: 'desc'
    }
  }, {
    total: $scope.history.length,
    getData: function($defer, params) {
      var data = params.sorting() ? $filter('orderBy')($scope.history, params.orderBy()) : $scope.history;
      $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
    }
  });

  $scope.$on('$paymentNotification', function(){
    $scope.tableParams.reload();
  });
}]);
