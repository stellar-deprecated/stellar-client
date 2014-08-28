var sc = angular.module('stellarClient');

sc.controller('AddGatewayCtrl', function($scope, $q, session, singletonPromise, stNetwork, Gateways) {
  // INHERITED FROM ManageCurrenciesCtrl
  // $scope.gateways

  $scope.resetSearch = function() {
    $scope.gatewaySearch = '';
    $scope.searchStatus  = '';
    $scope.foundGateway  = null;
  };

  $scope.loadCurrencies = singletonPromise(function (){
    $scope.searchStatus = 'loading';

    if($scope.gateways[$scope.gatewaySearch]) {
      $scope.searchStatus = 'already_added';
      return;
    }


    Gateways.search($scope.gatewaySearch)
      .then(function(gateway) {
        $scope.foundGateway = gateway;
        $scope.searchStatus = _.any($scope.foundGateway.currencies) ? 'found' : 'no_currencies';
      })
      .catch(function() {
        //TODO: we need to target the error better
        $scope.foundGateway = null;
        $scope.searchStatus = 'not_found';
      });
  });

  $scope.addGateway = function() {
    // maybe we trigger an error here? it shouldn't ever occurr
    if(!$scope.foundGateway){ return; }

    Gateways.add($scope.foundGateway);
    $scope.resetSearch();
  };

  $scope.resetSearch();
});
