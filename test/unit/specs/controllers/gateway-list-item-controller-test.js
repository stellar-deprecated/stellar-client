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
    scope.showRemoveAlert = sinon.spy()
    scope.gateway =  {domain: 'removing-gateway', currencies: [{currency: 'usd'}, {currency: 'cny'}]};
    expect(inner_session.get().mainData.gateways['removing-gateway'].domain).to.equal(scope.gateway.domain);
    scope.remove();
    expect(scope.gateway.status).to.equal('removing')
    expect(inner_session.get().mainData.gateways['removing-gateway'].status).to.equal('removing');
    rootScope.$apply();
    expect(inner_session.get().mainData.gateways['removing-gateway']).to.equal(undefined);
    //note we're not actually removing the gateway from the scope, we're only removing it from the session
    expect(scope.gateway.status).to.equal('removing')
    expect(scope.showRemoveAlert.calledWithExactly('removing-gateway')).to.be.true
  });
  
  it('You should be able to retry adding a gateway', function () {
    scope.gateway = {domain: 'new-gateway', currencies: [{currency: 'usd'}, {currency: 'cny'}]};
    expect(inner_session.get().mainData.gateways['new-gateway']).to.equal(undefined);
    scope.retryAdd();
    expect(inner_session.get().mainData.gateways['new-gateway'].status).to.equal('adding');
    rootScope.$apply();
    expect(inner_session.get().mainData.gateways['new-gateway'].status).to.equal('added');
  });
  
  it('You should be able to cancel adding a gateway', function () {
    scope.gateway = {domain: 'test-gateway', currencies: [{currency: 'usd'}, {currency: 'cny'}]};
    expect(inner_session.get().mainData.gateways['test-gateway']).to.exists;
    scope.cancelAdd();
    expect(inner_session.get().mainData.gateways['test-gateway']).to.be.undefined;
  });
  
  it('currencyNames should return the names of the currencies of the current gateway', function () {
    scope.gateway = {domain: 'test-gateway', currencies: [{currency: 'usd'}, {currency: 'cny'}]};
    expect(scope.currencyNames()).to.equal('usd, cny')
  })
 
});

