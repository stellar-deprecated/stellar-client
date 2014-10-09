// registration_spec.js
var stellarAPIMock = require('../../stellar-api-mock');

describe('registration page', function() {
  var ptor;

  beforeEach(function() {
    browser.get('/#/register');
    ptor = protractor.getInstance();

    browser.addMockModule('stellarAPI', stellarAPIMock.setup);
  });

  it('should show username and password missing error message', function() {
    element(by.buttonText('Submit')).click();

    expect(element(by.binding('errors.usernameErrors')).getText()).toEqual('The username field is required.');
    expect(ptor.isElementPresent(by.css('#username.input-error'))).toBeTruthy();
    expect(element(by.binding('errors.passwordErrors')).getText()).toEqual('The password field is required.');
    expect(ptor.isElementPresent(by.css('#password.input-error'))).toBeTruthy();
  });

  it('should show an error when a username is taken', function () {
    element(by.model('data.username')).sendKeys('existingUsername');

    ptor.wait(function() {
      return ptor.isElementPresent(by.css('#username-status.glyphicon-remove'));
    }, 5000);

    expect(ptor.isElementPresent(by.css('#username-status.glyphicon-remove'))).toBeTruthy();
    expect(element(by.binding('errors.usernameErrors')).getText()).toEqual('This username is taken.');
    expect(ptor.isElementPresent(by.css('#username.input-error'))).toBeTruthy();
  });

  it('should allow using an available username', function () {
    element(by.model('data.username')).sendKeys('newUsername');

    ptor.wait(function() {
      return ptor.isElementPresent(by.css('#username-status.glyphicon-ok'));
    }, 5000);

    expect(ptor.isElementPresent(by.css('#username-status.glyphicon-ok'))).toBeTruthy();
    expect(element(by.binding('errors.usernameErrors')).getText()).toEqual('');
    expect(ptor.isElementPresent(by.css('#username:not(.input-error)'))).toBeTruthy();
  });
});