'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', ['$scope', function($scope)
{
  $scope.typeIcons = {
    'sent': 'glyphicon glyphicon-upload',
    'received': 'glyphicon glyphicon-download'
  };
}]);
