'use strict';

describe('Controller: PasswordCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));

  var PasswordCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    //the stuff added below to the scope should, outside of tests, all be inherited from the parent scope (RegistrationCtrl)
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
    expect(scope.validators).to.be.ok
    expect(scope.passwordStrength).to.equal('');
    expect(scope.passwordLevel).to.equal('null');
    expect(scope.rawScore).to.equal(0);
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
  
  it('If the password and its confirmation partially match, show a glyhicon-none', function () {
    scope.data = {password: 'testpassword', passwordConfirmation: 'test'}
    scope.status = {passwordConfirmValid: false};
    expect(scope.confirmPasswordClass()).to.equal('glyphicon-none');
  });
  
  it('If the password is empty, passwordStrength should return an empty string', function () {
    scope.data = {password: ''}
    scope.$digest();
    expect(scope.passwordStrength).to.equal('');
    expect(scope.passwordLevel).to.equal('null');
  });
  
  it('If the password is weak, the strenght, score and raw score of the password should be set to WEAK, level1 and 0', function () {
    scope.data = {password: 'abc'}
    scope.$digest();
    expect(scope.passwordStrength).to.equal('WEAK');
    expect(scope.passwordLevel).to.equal('level1');
    expect(scope.rawScore).to.equal(0);
  });
  
  it('If the password is not good enough, they should be set to ALMOST and level2', function () {
    scope.data = {password: 'serendip'}
    scope.$digest();
    expect(scope.passwordStrength).to.equal('ALMOST');
    expect(scope.passwordLevel).to.equal('level2');
    expect(scope.rawScore).to.equal(2);
  });
  
  it('The rawscore should be reset to 0 if the password input is removed', function () {
    scope.data = {password: 'serendip'}
    scope.$digest();
    expect(scope.rawScore).to.equal(2);
    scope.data = {password: ''}
    scope.$digest();
    expect(scope.rawScore).to.equal(0);
  });
  
  it('If the password is OK, they should be set to GOOD and level3', function () {
    scope.data = {password: 'serend$ip'}
    scope.$digest();
    expect(scope.passwordStrength).to.equal('GOOD');
    expect(scope.passwordLevel).to.equal('level3');
    expect(scope.rawScore).to.equal(3);
  });
  
  it('If the password is really good, they should be set to STRONG and level4', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk'}
    scope.$digest();
    expect(scope.passwordStrength).to.equal('STRONG');
    expect(scope.passwordLevel).to.equal('level4');
    expect(scope.rawScore).to.equal(4);
  });
  
  it('Only good passwords that comes with a matching confirmation should be valid', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk', passwordConfirmation: 'yAs5woN8E5oG5BA$wk'}
    scope.$digest();
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.true;
    expect(scope.status.passwordConfirmValid).to.be.true;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  it('A weak password, even with a matching confirmation, should not be valid', function () {
    scope.data = {password: 'hello', passwordConfirmation: 'hello'}
    scope.$digest();
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.false;
    expect(scope.status.passwordConfirmValid).to.be.true;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  it('Without a matching confirmation, a password should not be valid', function () {
    scope.data = {password: 'yAs5woN8E5oG5BA$wk', passwordConfirmation: ''}
    scope.$digest();
    scope.checkPassword();
    expect(scope.status.passwordValid).to.be.true;
    expect(scope.status.passwordConfirmValid).to.be.false;
    expect(scope.errors.passwordErrors).to.be.empty;
    expect(scope.errors.passwordConfirmErrors).to.be.empty;
  });
  
  it('If there is no password, validateInput should mark that as an error', function () {
    scope.data = {password: ''}
    _.forEach(scope.validators, function(validator) {
      expect(validator()).to.be.false;
    });
    expect(scope.errors.passwordErrors).to.include('The password field is required.')
  });
  
  it('If the password is invalid, validateInput should mark that as an error', function () {
    scope.data = {password: 'Great password'}
    scope.status.passwordValid = false;
    _.forEach(scope.validators, function(validator) {
      expect(validator()).to.be.false;
    });
    expect(scope.errors.passwordErrors).to.include('The password is not strong enough.')
  });
  
  it('If the password is valid but the confirmation is not, validateInput should mark that as an error', function () {
    scope.data = {password: 'Great password'}
    scope.status.passwordValid = true;
    scope.status.passwordConfirmValid = false;
    _.forEach(scope.validators, function(validator) {
      expect(validator()).to.be.false;
    });
    expect(scope.errors.passwordConfirmErrors).to.include('The passwords do not match.')
  });
    
});