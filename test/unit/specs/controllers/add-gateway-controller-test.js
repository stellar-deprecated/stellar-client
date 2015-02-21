'use strict';

describe('Controller: AddGatewayCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  //load the mocks for services
  beforeEach(module('serviceMocks'));

  var AddGatewayCtrl, scope, mockBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    scope = $rootScope.$new();
    AddGatewayCtrl = $controller('AddGatewayCtrl', {
      $scope: scope
    });
    mockBackend = $httpBackend;
  }));
  
  afterEach(function() {
    mockBackend.verifyNoOutstandingExpectation();
    mockBackend.verifyNoOutstandingRequest();
  });

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
  
  it('If a gateway was already added, the searchStatus should reflect that', function () {
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