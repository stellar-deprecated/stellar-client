var sc = angular.module('stellarClient');

sc.controller('AddGatewayCtrl', function($scope, $q, session, singletonPromise, StellarNetwork, Gateways) {
  // INHERITED FROM ManageCurrenciesCtrl
  // $scope.gateways

  // Populate the add gateway form with parameters from the add-gateway action.
  $scope.$on('action-add-gateway', function(event, params){
    $scope.openManageCurrencies();
    $scope.fromActionLink = true;

    // If user got here from a weblink, scroll to the `add gateway` section for them
    setTimeout(function() {
      $('html, body').animate({scrollTop: $('#action-add-gateway-scroll-point').offset().top - 20}, 400);
    }, 0);

    $scope.gatewaySearch = params.domain;
    $scope.loadCurrencies();
  });

  $scope.resetSearch = function() {
    $scope.gatewaySearch  = '';
    $scope.searchStatus   = '';
    $scope.foundGateway   = null;
    $scope.fromActionLink = false;
  };

  $scope.loadCurrencies = singletonPromise(function (){
    if (!$scope.gatewaySearch) { return; }

    $scope.searchStatus = 'loading';
    $scope.lastGatewaySearch = $scope.gatewaySearch;

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

    Gateways.add($scope.foundGateway).then(function(gateway) {
      $scope.showAddAlert(gateway.domain);
    });
    
    $scope.resetSearch();
  };

  $scope.resetSearch();
});
