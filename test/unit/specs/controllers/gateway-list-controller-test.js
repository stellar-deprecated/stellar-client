'use strict';

describe('Controller: GatewayListCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  //load the mocks for services
  beforeEach(module('serviceMocks'));
  

  var GatewayListCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GatewayListCtrl = $controller('GatewayListCtrl', {
      $scope: scope
    });
  }));

  it('If there are any gateways, hasGateways should resolve to true', function () {
    scope.gateways = ['one_gateway', 'two_gateway']
    expect(scope.hasGateways()).to.equal(true);
  });
  
  it('If there aren"t any gateways, hasGateways should resolve to false', function () {
    scope.gateways = []
    expect(scope.hasGateways()).to.equal(false);
  });
  
});