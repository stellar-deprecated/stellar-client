'use strict';

describe('Controller: AddEmailCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  //load the mocks for services
  beforeEach(module('serviceMocks'));
  

  var AddEmailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddEmailCtrl = $controller('AddEmailCtrl', {
      $scope: scope
    });
  }));

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

  
});