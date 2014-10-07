// registration_spec.js
describe('registration page', function() {
  var ptor;

  beforeEach(function() {
    browser.get('/#/register');
    ptor = protractor.getInstance();
  });

  it('should show username and password missing error message', function() {
    element(by.buttonText('Submit')).click();

    expect(element(by.binding('errors.usernameErrors')).getText()).toEqual('The username field is required.');
    expect(ptor.isElementPresent(by.css('#username.input-error'))).toBeTruthy();
    expect(element(by.binding('errors.passwordErrors')).getText()).toEqual('The password field is required.');
    expect(ptor.isElementPresent(by.css('#password.input-error'))).toBeTruthy();
  });
});