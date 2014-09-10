var sc = angular.module('stellarClient');

sc.controller('GatewayListItemCtrl', function($scope, Gateways) {

  $scope.remove = function() {    
    Gateways.remove($scope.gateway).then(function(gateway) {
      $scope.showRemoveAlert(gateway.domain);
    });
  };

  $scope.retryAdd = function() {
    Gateways.add($scope.gateway);
  };

  $scope.cancelAdd = function() {
    Gateways.forceRemove($scope.gateway);
  };

  $scope.currencyNames = function() {
    return _($scope.gateway.currencies).pluck('currency').join(', ');
  };

});
