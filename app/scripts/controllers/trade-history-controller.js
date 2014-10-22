var sc = angular.module('stellarClient');

sc.controller('TradeHistoryCtrl', function($scope, TradeHistory, singletonPromise) {
  $scope.$on('trade-history:new', updateTradePage);

  $scope.trades = [];
  $scope.currentPage = 1;
  $scope.lastPage = TradeHistory.lastPage;

  function updateTradePage(){
    return TradeHistory.getPage($scope.currentPage)
      .then(function(page) {
        $scope.trades = page;
      });
  }

  $scope.nextPage = function() {
    $scope.currentPage = Math.min($scope.currentPage + 1, $scope.lastPage());

    updateTradePage();
  };

  $scope.previousPage = function() {
    $scope.currentPage = Math.max($scope.currentPage - 1, 1);

    updateTradePage();
  };

  $scope.getFirstPage = singletonPromise(function() {
    return updateTradePage();
  });

  $scope.getFirstPage();
});