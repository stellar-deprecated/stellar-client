'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', function($scope, transactionHistory, gettextCatalog) {
  $scope.typeIcons = {
    'sent': 'icon icon-send',
    'received': 'icon icon-receive'
  };

  $scope.$on("transactionHistory.historyUpdated", updateTransactionPage);

  $scope.transactionPage = [];

  function updateTransactionPage(){
    return transactionHistory.getPage($scope.pagingOptions.currentPage)
      .then(function(page) {
        $scope.transactionPage = page;
      });
  }

  $scope.lastPage = transactionHistory.lastPage;

  $scope.nextPage = function() {
    $scope.pagingOptions.currentPage = Math.min($scope.pagingOptions.currentPage + 1, $scope.lastPage());

    updateTransactionPage();
  };

  $scope.previousPage = function() {
    $scope.pagingOptions.currentPage = Math.max($scope.pagingOptions.currentPage - 1, 1);

    updateTransactionPage();
  };

  $scope.pagingOptions = {
    pageSizes: [10, 25, 50, 100],
    pageSize: Options.transactions_per_page,
    currentPage: 1
  };

  transactionHistory.init()
    .then(updateTransactionPage);

  $scope.transactionGrid = {
    data: 'transactionPage',
    enableRowSelection: false,
    enableHighlighting: true,
    enablePaging: true,
    pagingOptions: $scope.pagingOptions,
    useExternalSorting: true,
    plugins: [new ngGridFlexibleHeightPlugin()],
    headerRowHeight: '70',
    rowHeight: '70',
    rowTemplate: '<div ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}">&nbsp;</div><div ng-cell></div></div>',
    columnDefs: [
      {
        field: 'transaction.type',
        displayName: gettextCatalog.getString('Type'),
        sortable: false,
        maxWidth: '150',
        cellTemplate: '<i ng-class="typeIcons[row.getProperty(col.field)]"></i> ' +
                      '<span class="tx-type">{{ row.getProperty(col.field) }}</span>',
        cellClass: 'type'
      },
      {
        field: 'transaction.amount',
        displayName: gettextCatalog.getString('Amount'),
        sortable: false,
        width: '20%',
        cellTemplate: '<span>{{ row.getProperty(col.field).to_human() }} {{row.getProperty(col.field).currency().to_human()}}</span>' +
                      '<span class="address issuer">{{ row.getProperty(col.field).issuer().to_json() | addressToUsername }}</span>',
        cellClass: 'amount'
      },
      {
        field: 'date',
        displayName: gettextCatalog.getString('Date'),
        sortable: false,
        width: '20%',
        cellTemplate: '<span am-time-ago="row.getProperty(col.field)"></span>'
      },
      {
        field: 'transaction.type',
        displayName: '',
        sortable: false,
        width: '60',
        cellTemplate: '<span class="tx-direction">{{ row.getProperty(col.field) === "sent" ? "to" : "from" }}</span>'
      },
      {
        field: 'transaction.counterparty',
        displayName: '',
        sortable: false,
        width: '*',
        cellTemplate: '<span class="address">{{ row.getProperty(col.field) | addressToUsername }}</span>'
      }
    ]
  };
});