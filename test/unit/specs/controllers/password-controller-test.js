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
  
  it('if the password is valid, and the password confirmation matches, show a glyphicon-ok', function () {
    scope.data = {password: 'testpassword', passwordConfirmation: 'testpassword'}
    scope.status = {passwordConfirmValid: true};
    expect(scope.confirmPasswordClass()).to.equal('glyphicon-ok');
  });
  
  it('If the password and its confirmation do not match, show a glyhicon-remove', function () {
    scope.data = {password: 'testpassword', passwordConfirmation: 'test33'}
    scope.status = {passwordConfirmValid: false};
    expect(scope.confirmPasswordClass()).to.equal('glyphicon-remove');
  });
  
  it('If the password and its confirmation partially match, show a glyhicon-non', function () {
    scope.data = {password: 'testpassword', passwordConfirmation: 'test'}
    scope.status = {passwordConfirmValid: false};
    expect(scope.confirmPasswordClass()).to.equal('glyphicon-none');
  });
  
  
});