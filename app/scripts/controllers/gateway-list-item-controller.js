var sc = angular.module('stellarClient');

sc.controller('GatewayListItemCtrl', function($scope, Gateways) {

  $scope.remove = function() {    
    Gateways.remove($scope.gateway);
  };

  $scope.retryAdd = function() {
    Gateways.add($scope.gateway);
  };


  $scope.currencyNames = function() {
    return _($scope.gateway.currencies).pluck('currency').join(', ');
  };

});
