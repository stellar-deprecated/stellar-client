'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', function($scope)
{
  $scope.typeIcons = {
    'sent': 'icon icon-send',
    'received': 'icon icon-receive'
  };

  function sortAmount(a, b){
    return a.to_number() - b.to_number();
  }

  $scope.transactionGrid = {
    data: 'history',
    enableRowSelection: false,
    enableHighlighting: true,
    plugins: [new ngGridFlexibleHeightPlugin()],
    headerRowHeight: '70',
    rowHeight: '70',
    rowTemplate: '<div ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}">&nbsp;</div><div ng-cell></div></div>',
    columnDefs: [
      {
        field: 'transaction.type',
        displayName: 'Type',
        width: '150',
        cellTemplate: '<i ng-class="typeIcons[row.getProperty(col.field)]"></i> ' +
                      '<span class="tx-type">{{ row.getProperty(col.field) }}</span>'
      },
      {
        field: 'transaction.amount',
        displayName: 'Amount',
        width: '20%',
        cellTemplate: '<span>{{ row.getProperty(col.field).to_human() }} STR</span>',
        sortFn: function(a, b){
          return a.to_number() - b.to_number();
        }
      },
      {
        field: 'date',
        displayName: 'Date',
        width: '20%',
        cellTemplate: '<span am-time-ago="row.getProperty(col.field)"></span>'
      },
      {
        field: 'transaction.type',
        displayName: '',
        width: '60',
        cellTemplate: '<span class="tx-direction">{{ row.getProperty(col.field) === "sent" ? "to" : "from" }}</span>'
      },
      {
        field: 'transaction.counterparty',
        displayName: '',
        width: '35%',
        cellTemplate: '<span class="address">{{ row.getProperty(col.field) | addressToUsername }}</span>'
      }
    ]
  };
});
