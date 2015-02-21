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
  
});