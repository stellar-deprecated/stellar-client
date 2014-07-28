'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', function($scope, transactionHistory) {
  transactionHistory.init();

  $scope.typeIcons = {
    'sent': 'icon icon-send',
    'received': 'icon icon-receive'
  };

  $scope.$on("transactionHistory.historyUpdated", function(e, history) {
    $scope.history = history;
    newHistory();
  })

  $scope.history = [];
  $scope.sortedHistory = [];
  $scope.transactionPage = [];

  function newHistory() {
    $scope.sortedHistory = $scope.history.slice();
    $scope.lastPage = Math.ceil($scope.sortedHistory.length / $scope.pagingOptions.pageSize);

    sortTransactionHistory();
    updateTransactionPage();
  }

  function updateTransactionPage(){
    var startIndex = ($scope.pagingOptions.currentPage - 1) * $scope.pagingOptions.pageSize;
    $scope.transactionPage = $scope.sortedHistory.slice(startIndex, startIndex + $scope.pagingOptions.pageSize);
  }

  $scope.nextPage = function() {
    $scope.pagingOptions.currentPage = Math.min($scope.pagingOptions.currentPage + 1, $scope.lastPage);
  };

  $scope.previousPage = function() {
    $scope.pagingOptions.currentPage = Math.max($scope.pagingOptions.currentPage - 1, 1);
  };

  $scope.$watch('pagingOptions', function() {
    updateTransactionPage();
  }, true);

  $scope.$watch('sortOptions', function() {
    sortTransactionHistory();
    updateTransactionPage();
  }, true);

  $scope.pagingOptions = {
    pageSizes: [10, 25, 50, 100],
    pageSize: Options.transactions_per_page,
    currentPage: 1
  };

  $scope.sortOptions = {
    fields: ['date'],
    directions: ['desc']
  };

  $scope.transactionGrid = {
    data: 'transactionPage',
    enableRowSelection: false,
    enableHighlighting: true,
    enablePaging: true,
    pagingOptions: $scope.pagingOptions,
    sortInfo: $scope.sortOptions,
    useExternalSorting: true,
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

  // ng-grid requires external sorting when paginating.
  // TODO: Consider resolving $scope.sortOptions.fields to the transaction property
  // and using $scope.sortOptions.columns[0].sortingAlgorithm for custom sort predicates.
  // Consider adding this functionality to a fork of ng-grid.
  function sortTransactionHistory(){
      
    var sortPredicate = getSortPredicate($scope.sortOptions.fields[0], $scope.sortOptions.directions[0]);
    $scope.sortedHistory.sort(sortPredicate);
  }

  function getSortPredicate(field, direction) {
    var ascPredicate;

    switch(field) {
      case 'transaction.type':
        ascPredicate = function(a, b){
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        };
        break;
      case 'date':
        ascPredicate = function(a, b){
          return a.date - b.date;
        };
        break;
      case 'transaction.amount':
        ascPredicate = function(a, b){
          return a.to_number() - b.to_number();;
        };
        break;
    }

    if(direction == 'asc') {
      return ascPredicate;
    } else {
      return function(a, b) {
        return ascPredicate(b, a);
      };
    }

  }
});
