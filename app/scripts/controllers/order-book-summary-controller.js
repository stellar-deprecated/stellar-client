var sc = angular.module('stellarClient');

sc.controller('OrderBookSummaryCtrl', function($scope) {
  $scope.currencyPairName = '';

  $scope.$on("trading:order-book-updated", function(e, orderBook) {
    if(orderBook === $scope.currentOrderBook) {
      $scope.loadOrderBookSummary();
    }
  });

  $scope.$watch("currentOrderBook", function() {
    $scope.loadOrderBookSummary();
  });

  $scope.loadOrderBookSummary = function() {
    if($scope.currentOrderBook) {
      var currencyPair = $scope.currentOrderBook.getCurrencyPair();
      $scope.currencyPairName = $scope.currencyPairToString(currencyPair);

      var summary       = $scope.currentOrderBook.getSummary();
      $scope.highestBid = summary.highestBid;
      $scope.lowestAsk  = summary.lowestAsk;
      $scope.spread     = summary.spread;
      $scope.lastPrice  = summary.lastPrice;
    } else {
      $scope.highestBid = null;
      $scope.lowestAsk  = null;
      $scope.spread     = null;
      $scope.lastPrice  = null;
    }
  };


});