'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', function($scope)
{
  $scope.typeIcons = {
    'sent': 'glyphicon glyphicon-upload',
    'received': 'glyphicon glyphicon-download'
  };

  function sortAmount(a, b){
    return a.to_number() - b.to_number();
  }

  $scope.transactionGrid = {
    data: 'history',
    enableRowSelection: false,
    plugins: [new ngGridFlexibleHeightPlugin()],
    columnDefs: [
      {
        field: 'transaction.type',
        displayName: 'Type',
        cellTemplate: '<i ng-class="typeIcons[row.getProperty(col.field)]"></i> ' +
                      '<span>{{ row.getProperty(col.field) }}</span>'
      },
      {
        field: 'transaction.amount',
        displayName: 'Amount',
        cellTemplate: '<span>{{ row.getProperty(col.field).to_human() }} STR</span>',
        sortFn: function(a, b){
          return a.to_number() - b.to_number();
        }
      },
      {
        field: 'date',
        displayName: 'Date',
        cellTemplate: '<span am-time-ago="row.getProperty(col.field)"></span>'
      },
      {
        field: 'transaction.type',
        displayName: '',
        cellTemplate: '<span>{{ row.getProperty(col.field) === "sent" ? "to" : "from" }}</span>'
      },
      {
        field: 'transaction.counterparty',
        displayName: '',
        cellTemplate: '<span class="address">{{ row.getProperty(col.field) | addressToUsername }}</span>'
      }
    ]
  };
});
