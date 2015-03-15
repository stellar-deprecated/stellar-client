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
    scope.errors = {};
    scope.status = {};
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
  
  it('If the password is empty, passwordStrength should return an empty string', function () {
    scope.data = {password: ''}
    expect(scope.passwordStrength()).to.equal('');
  });
  
  it('If the password is weak, passwordStrength should return WEAK', function () {
    scope.data = {password: 'abc'}
    expect(scope.passwordStrength()).to.equal('WEAK');
  });
  
  it('If the password is not quite good enough, passwordStrength should return ALMOST', function () {
    scope.data = {password: 'serend'}
    expect(scope.passwordStrength()).to.equal('ALMOST');
  });
  
  it('If the password is OK, passwordStrength should return GOOD', function () {
    scope.data = {password: 'serendip'}
    expect(scope.passwordStrength()).to.equal('GOOD');
  });
  
  it('If the password is really good, passwordStrength should return STRONG', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk'}
    expect(scope.passwordStrength()).to.equal('STRONG');
  });
  
  it('Only good password that come with a matching confirmation should be valid', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk', passwordConfirmation: 'yAs5woN8E5oG5BA$wk'}
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.true;
    expect(scope.status.passwordConfirmValid).to.be.true;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  it('A weak password, even with a matching confirmation, should not be valid', function () {
    scope.data = {password: 'hello', passwordConfirmation: 'hello'}
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.false;
    expect(scope.status.passwordConfirmValid).to.be.true;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  it('Without a matching confirmation, a password should not be valid', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk', passwordConfirmation: ''}
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.true;
    expect(scope.status.passwordConfirmValid).to.be.false;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  
});