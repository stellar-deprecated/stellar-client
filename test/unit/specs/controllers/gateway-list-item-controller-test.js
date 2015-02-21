'use strict';

describe('Controller: GatewayListItemCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  beforeEach(module('mockStellarNetwork'));
  
  var GatewayListItemCtrl, scope, rootScope, inner_session;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, session) {
    rootScope = $rootScope;
    inner_session = session;
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
    var promise = scope.remove();
    expect(inner_session.get().mainData.gateways['removing-gateway'].status).to.equal('removing');
    rootScope.$apply();
    expect(inner_session.get().mainData.gateways['removing-gateway']).to.equal(undefined);
    
    
  });
 
});