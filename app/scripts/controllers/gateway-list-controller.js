var sc = angular.module('stellarClient');

sc.controller('GatewayListCtrl', function($scope) {

  $scope.hasGateways = function() {
    return _.any($scope.gateways);
  };

});
