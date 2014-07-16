'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($scope, $state, $timeout, $http, $q, session, debounce, singletonPromise) {
  $scope.data = {
    username:             '',
    email:                '',
    password:             '',
    passwordConfirmation: ''
  };

  $scope.status = {
    usernameAvailable:    null,
    emailAvailable:       null,
    passwordValid:        null,
    passwordConfirmValid: null
  };

  $scope.errors = {
    usernameErrors:        [],
    emailErrors:           [],
    passwordErrors:        [],
    passwordConfirmErrors: []
  };

  $scope.validators = [];
  $scope.noEmailWarning = false;

  var wallet = null;
  var signingKeys = null;

  // Checks to see if the supplied username is available.
  // This function is debounced to prevent API calls before the user is finished typing.
  var checkUsername = debounce(2000, function(){
    if ($scope.data.username === '') {
      $scope.status.usernameAvailable = null;
    } else {
      var error = getUsernameError($scope.data.username);
      if (error) {
        $scope.errors.usernameErrors.push(error);
        $scope.status.usernameAvailable = false;
        return;
      }
      $http.post(Options.API_SERVER + '/user/validname', {username: $scope.data.username})
      .success(
        function (response) {
          console.log(response.status);
          $scope.status.usernameAvailable = true;
        })
      .error(
        function (response){
          switch(response && response.code) {
            case 'already_taken':
              $scope.errors.usernameErrors.push('This username is taken.');
              $scope.status.usernameAvailable = false;
              break;
            default:
              $scope.errors.usernameErrors.push('An error occurred.');
              $scope.status.usernameAvailable = null;
          }
        });
    }
  });

  function getUsernameError(username) {
    if (username.length < 3 || username.length > 20) {
      return "Username must be between 3 and 20 characters";
    }
     if(!username.match(/^[a-zA-Z0-9].*[a-zA-Z0-9]$/))
     {
         return "Must start and end with a letter or number.";
     }
    if (!username.match(/^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*$/)) {
      //return "Must start and end with a letter, and may contain \".\", \"_\", or \"-\"";
        return "Only letters numbers or ._-";
    }
    return null;
  }

  // The following functions validate user input on the fly.
  // This will clear error messages once the input is valid.

  $scope.checkUsername = function(){
    $scope.errors.usernameErrors = [];
    $scope.status.usernameAvailable = null;

    if($scope.data.username !== '') checkUsername();
  };

  // The following functions calculate the classes to be applied to the form.

  $scope.usernameClass = function(){
    if($scope.status.usernameAvailable === null){
      if($scope.data.username !== '') return 'glyphicon-refresh spin';
      else return 'glyphicon-none';
    }

    else return $scope.status.usernameAvailable ? 'glyphicon-ok' : 'glyphicon-remove';
  };

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  function validateInput() {
    // Remove any previous error messages.
    $scope.errors.usernameErrors        = [];
    $scope.errors.emailErrors           = [];

    var validInput = true;

    if(!$scope.data.username){
      validInput = false;
      $scope.errors.usernameErrors.push('The username field is required.');
    }
    else if($scope.status.usernameAvailable === false){
      validInput = false;
      $scope.errors.usernameErrors.push('This username is taken.');
    }

    if(!registration.email.value && $scope.noEmailWarning == false) {
      validInput = false;
      $scope.noEmailWarning = true;
    } else if(registration.email.value && !$scope.data.email) {
      validInput = false;
      $scope.errors.emailErrors.push('Invalid email address.');
    }

    $scope.validators.forEach(function(validator){
      validInput = validator() && validInput;
    });

    if(validInput){
      return $q.when();
    } else {
      return $q.reject();
    }
  }

  $scope.addEmail = function(){
    $scope.noEmailWarning = false;
    $('#email').focus();
  };

  $scope.ignoreEmail = function(){
    $scope.noEmailWarning = null;
    $scope.attemptRegistration();
  };

  $scope.attemptRegistration = singletonPromise(function() {
    return validateInput()
      .then(submitRegistration)
      .then(createWallet)
      .then(function(){
        // Initialize the session with the new wallet.
        session.login(wallet);

        // Take the user to the dashboard.
        $state.go('dashboard');
      });
  });

  function submitRegistration() {
    signingKeys = new SigningKeys();

    var data = {
      alphaCode: session.get('alpha'),
      username: $scope.data.username,
      email: $scope.data.email,
      address: signingKeys.address
    };

    // Submit the registration data to the server.
    return $http.post(Options.API_SERVER + '/user/register', data)
      .error(showRegistrationErrors);
  }

  function showRegistrationErrors(response) {
    var usernameErrorMessages = {
      'already_taken': 'The username is taken.',
      'invalid': 'Username must start and end with a letter, and may contain ".", "_", or "-"'
    };

    var emailErrorMessages = {
      'already_taken': 'The email is taken.',
      'invalid': 'The email is invalid.'
    };

    var alphaCodeErrorMessages = {
      'already_taken': 'The alpha code is taken.',
      'invalid': 'The alpha code is invalid.'
    };

    if (response && response.status == "fail") {
      if (response.code == "validation_error") {
        var error = response.data;
        switch(error.field) {
          case 'username':
            $scope.errors.usernameErrors.push(usernameErrorMessages[error.code]);
            break;

          case 'email':
            $scope.errors.emailErrors.push(emailErrorMessages[error.code]);
            break;

          case 'alpha_code':
            // TODO: ux for alpha code errors
            break;
        }
      }
    } else {
      $scope.errors.usernameErrors.push('Registration error?');
    }
  }

  function createWallet(response) {
    var id = Wallet.deriveId($scope.data.username.toLowerCase(), $scope.data.password);
    var key = Wallet.deriveKey(id, $scope.data.username.toLowerCase(), $scope.data.password);

    wallet = new Wallet({
      id: id,
      key: key,
      keychainData: {
        authToken: response.data.data.authToken,
        updateToken: response.data.data.updateToken,
        signingKeys: signingKeys
      },
      mainData: {
        username: $scope.data.username,
        email: $scope.data.email,
        server: Options.server,
        contacts: {},
        stellar_contact: Options.stellar_contact
      }
    });

    // add the default contact
    wallet.mainData.contacts[Options.stellar_contact.destination_address] = Options.stellar_contact;

    // Upload the new wallet to the server.
    return session.syncWallet(wallet, 'create');
  }
});
