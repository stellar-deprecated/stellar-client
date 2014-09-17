// spec.js
describe('registration page', function() {
    var USERNAME_EMPTY_ERROR_MESSAGE = "The username field is required.";
    var PASSWORD_EMPTY_ERROR_MESSAGE = "The password field is required.";

    it('should show username and password missing error message', function() {
        browser.get('/#/register');

        element(by.buttonText("Submit")).click();

        expect(element(by.binding('errors.usernameErrors')).getText())
            .toEqual(USERNAME_EMPTY_ERROR_MESSAGE);

        expect(element(by.binding('errors.passwordErrors')).getText())
            .toEqual(PASSWORD_EMPTY_ERROR_MESSAGE);
    });

    it('should show username taken error', function () {
        browser.get('/#/register');
    });
});