'use strict';

describe('Controller: GatewayListItemCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  
  var GatewayListItemCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GatewayListItemCtrl = $controller('GatewayListItemCtrl', {
      $scope: scope
    });
  }));

  it('You should be able to remove the current gateway', function () {
    scope.gateway =  {
            domain: 'removing-gateway', 
            currencies: ['usd', 'cny'],
            status: 'removing'
          };
    scope.remove();
    expect(scope.gateway).to.equal(null);
  });
 
});