'use strict';

describe('Controller: AddEmailCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  beforeEach(module('mockGateway'));
  

  var AddEmailCtrl, scope, mockBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    scope = $rootScope.$new();
    AddEmailCtrl = $controller('AddEmailCtrl', {
      $scope: scope
    });
    mockBackend = $httpBackend;
  }));
  
  afterEach(function() {
    mockBackend.verifyNoOutstandingExpectation();
    mockBackend.verifyNoOutstandingRequest();
  });

  it('Initially, scope.loading should be false', function () {
    expect(scope.loading).to.equal(false);
  });
  
  it('if no email is provided, loading should be set to false, and an error should be shown', function () {
    scope.addEmail();
    expect(scope.loading).to.equal(false);
    expect(scope.errors).to.include("Please enter a valid email.");
  });
  
  it('if an email is provided, loading should be set to true, and no error should be shown', function () {
    scope.email = 'test@gmail.com'
    scope.addEmail();
    expect(scope.loading).to.equal(true);
    expect(scope.errors).to.be.empty;
  });
  
  it('The provided email should be posted to the server and upon success added to the wallet data', function () {
    mockBackend.expectPOST(Options.API_SERVER + "/user/email").respond('ok');
    scope.email = 'test@gmail.com'
    scope.addEmail();
    mockBackend.flush();
    //wallet not part of the scope, can't access in unit tests
    //expect(scope.wallet.mainData.email).to.equal('test@gmail.com')
    expect(scope.loading).to.equal(false);
  });
  
  it('If the email is already taken, this should be shown as an error', function () {
    mockBackend.expectPOST(Options.API_SERVER + "/user/email").respond(500, {status: 'fail', code: 'already_taken'});
    scope.email = 'test@gmail.com'
    scope.addEmail();
    mockBackend.flush();
    //expect(scope.wallet.mainData.email).to.equal('');
    expect(scope.errors).to.include("This email is already taken.");
    expect(scope.loading).to.equal(false);
  });
  
  it('If the server responds with an unknown error, this should be shown as an error', function () {
    mockBackend.expectPOST(Options.API_SERVER + "/user/email").respond(500, {status: 'fail', code: 'unknown'});
    scope.email = 'test@gmail.com'
    scope.addEmail();
    mockBackend.flush();
    //expect(scope.wallet.mainData.email).to.equal('');
    expect(scope.errors).to.include("Server error.");
    expect(scope.loading).to.equal(false);
  });
  
});