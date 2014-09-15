var sc = angular.module('stellarClient');

sc.controller('OrderBookCtrl', function($scope, Trading) {
  $scope.currentBids      = [];
  $scope.currentAsks      = [];
  $scope.precision        = 6;

  $scope.$on("trading:order-book-updated", function(e, orderBook) {
    if(orderBook === $scope.currentOrderBook) {
      $scope.loadOrderBookData();
    }
  });

  $scope.$watch('currentOrderBook', function(newValue, oldValue) {
    if(newValue !== oldValue) {
      $scope.loadOrderBookData();
    }
  });

  $scope.loadOrderBookData = function() {
    if($scope.currentOrderBook){ 
      $scope.currentBids = $scope.currentOrderBook.getPriceLevels('bids');
      $scope.currentAsks = $scope.currentOrderBook.getPriceLevels('asks');
    } else {
      $scope.currentBids = [];
      $scope.currentAsks = [];
    }
  };

  $scope.loadOrderBookData();
});
