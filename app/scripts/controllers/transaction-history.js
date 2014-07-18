'use strict';

var sc = angular.module('stellarClient');

sc.controller('TransactionHistoryCtrl', function($scope)
{
  $scope.typeIcons = {
    'sent': 'icon icon-send',
    'received': 'icon icon-receive'
  };

  $scope.sortedHistory = [];
  $scope.transactionPage = [];

  function updateTransactions(){
    var startIndex = ($scope.pagingOptions.currentPage - 1) * $scope.pagingOptions.pageSize;
    $scope.transactionPage = $scope.sortedHistory.slice(startIndex, startIndex + $scope.pagingOptions.pageSize);
  }

  function updatePaging(){
    $scope.lastPage = Math.ceil($scope.sortedHistory.length / $scope.pagingOptions.pageSize);
    updateTransactions();
  }

  $scope.nextPage = function() {
    $scope.lastPage = Math.ceil($scope.sortedHistory.length / $scope.pagingOptions.pageSize);
    $scope.pagingOptions.currentPage = Math.min($scope.pagingOptions.currentPage + 1, $scope.lastPage);
  };

  $scope.previousPage = function() {
    $scope.pagingOptions.currentPage = Math.max($scope.pagingOptions.currentPage - 1, 1);
  };

  $scope.$watch('history', function() {
    $scope.sortedHistory = $scope.history.slice();
    sortTransactionHistory();
    updatePaging();
  }, true);

  $scope.$watch('pagingOptions', function() {
    updatePaging();
  }, true);

  $scope.$watch('sortOptions', function() {
    sortTransactionHistory();
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

  function sortAmount(a, b){
    return a.to_number() - b.to_number();
  }

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
    var sortPredicate;

    function compareStrings(a, b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }

    switch($scope.sortOptions.fields[0]) {
      case 'transaction.type':
        sortPredicate = function(a, b){
          return compareStrings(a.transaction.type, b.transaction.type);
        };
        break;
      case 'date':
        sortPredicate = function(a, b){
          return a.date - b.date;
        };
        break;
      case 'transaction.amount':
        sortPredicate = function(a, b){
          return sortAmount(a.transaction.amount, b.transaction.amount);
        };
        break;
    }

    if($scope.sortOptions.directions[0] == 'asc') {
      $scope.sortedHistory.sort(sortPredicate);
    } else {
      $scope.sortedHistory.sort(function(a, b) {
        return sortPredicate(b, a);
      });
    }

    updateTransactions();
  }
});
