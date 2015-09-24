'use strict';

describe('Controller: AddGatewayCtrl, mocking out Gateways.search', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  beforeEach(module('mockGateway'));

  var AddGatewayCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddGatewayCtrl = $controller('AddGatewayCtrl', {
      $scope: scope
    });
  }));

  it('Initially, the search params should always be reset', function () {
    expect(scope.gatewaySearch).to.equal('');
    expect(scope.searchStatus).to.equal('');
    expect(scope.foundGateway).to.equal(null);
    expect(scope.fromActionLink).to.equal(false);
  });
  
  it('If an empty search is triggered, nothing should happen', function () {
    expect(scope.gatewaySearch).to.equal('');
    scope.loadCurrencies();
    expect(scope.foundGateway).to.equal(null);
  });
  
  it('When searching for a gateway that had already been added, the searchStatus should reflect that', function () {
    scope.gateways = {'test-gateway': true};
    scope.gatewaySearch = 'test-gateway'
    scope.loadCurrencies();
    expect(scope.searchStatus).to.equal('already_added');
  });
  
  it('If a gateway is found, the result should be added to foundGateway', function () {
    scope.gateways = {};
    scope.gatewaySearch = 'test-gateway'
    var promise = scope.loadCurrencies();
    promise.then(function (){
      expect(scope.foundGateway).to.equal({domain: 'test gateway', curencies: ['usd', 'cny']});
      expect(scope.searchStatus).to.equal('found');
    });
  });

  it('If no gateway is found, the search status should resolve to not_found', function () {
    scope.gateways = {};
    scope.gatewaySearch = 'failing-gateway'
    var promise = scope.loadCurrencies();
    promise.then(function (){
      expect(scope.foundGateway).to.equal(null);
      expect(scope.searchStatus).to.equal('not_found');
    });
  });
  
});


describe('Controller: AddGatewayCtrl, without mocking out Gateways', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  beforeEach(module('mockStellarNetwork'));

  var AddGatewayCtrl, scope, rootScope, inner_session;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, session) {
    rootScope = $rootScope;
    inner_session = session;
    scope = $rootScope.$new();
    AddGatewayCtrl = $controller('AddGatewayCtrl', {
      $scope: scope
    });
  }));
  
  it('if you try to add a non-existing gateway, nothing should happen', function () {
    scope.showAddAlert = sinon.spy();
    scope.foundGateway = null;
    scope.addGateway();
    expect(scope.showAddAlert.called).to.be.false
  })
  
  it('You should be able to add a gateway that was found', function () {
    scope.showAddAlert = sinon.spy();
    scope.foundGateway = {domain: 'new-gateway', currencies: [{currency: 'usd'}, {currency: 'cny'}]};
    expect(inner_session.get('wallet').mainData.gateways['new-gateway']).to.equal(undefined);
    scope.addGateway();
    expect(inner_session.get('wallet').mainData.gateways['new-gateway'].status).to.equal('adding');
    rootScope.$apply();
    expect(inner_session.get('wallet').mainData.gateways['new-gateway'].status).to.equal('added');
    expect(scope.showAddAlert.calledWithExactly('new-gateway')).to.be.true
  });
  
});
