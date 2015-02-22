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
    expect(inner_session.get().mainData.gateways['removing-gateway'].domain).to.equal(scope.gateway.domain);
    scope.remove();
    expect(inner_session.get().mainData.gateways['removing-gateway'].status).to.equal('removing');
    rootScope.$apply();
    expect(inner_session.get().mainData.gateways['removing-gateway']).to.equal(undefined);
    //note we're not actually removing the gateway from the scope, we're only removing it from the session
    expect(scope.gateway.status).to.equal('removing')
  });
  
  it('You should be able to retry adding a gateway', function () {
    scope.gateway = {
            domain: 'new-gateway', 
            currencies: ['usd', 'cny'],
          };
    expect(inner_session.get().mainData.gateways['new-gateway']).to.equal(undefined);
    scope.retryAdd();
    expect(inner_session.get().mainData.gateways['new-gateway'].status).to.equal('adding');
    rootScope.$apply();
    expect(inner_session.get().mainData.gateways['new-gateway'].status).to.equal('added');
  });
 
});