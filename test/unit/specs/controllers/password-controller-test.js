'use strict';

describe('Controller: PasswordCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));
  
  //load the mocks for services
  beforeEach(module('mockSession'));
  beforeEach(module('mockGateway'));
  

  var PasswordCtrl, scope, mockBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    scope = $rootScope.$new();
    scope.validators = [];
    PasswordCtrl = $controller('PasswordCtrl', {
      $scope: scope
    });
  }));

  it('Should initialize the scope', function () {
    expect(scope.loading).to.equal(false);
    expect(scope.passwordConfirmation).to.equal('');
  });
  
  it('passwordClass() should reflect the validity of status.passwordValid', function () {
    scope.status = {passwordValid: true};
    expect(scope.passwordClass()).to.equal('glyphicon-ok');
    scope.status = {passwordValid: false};
    expect(scope.passwordClass()).to.equal('glyphicon-none');
  });
  
});