'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($rootScope, $scope, $state, $stateParams, $timeout, $http, $q, session, debounce, singletonPromise, Wallet, FlashMessages, invites, gettext) {
  // Provide a default value to protect against stale config files.
  Options.MAX_WALLET_ATTEMPTS = Options.MAX_WALLET_ATTEMPTS || 3;

  $scope.data = {
    username:             '',
    email:                '',
    password:             '',
    passwordConfirmation: ''
  };

  session.put('inviteCode', $stateParams.inviteCode);

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
          $scope.status.usernameAvailable = true;
        })
      .error(
        function (response){
          switch(response && response.code) {
            case 'already_taken':
              $scope.errors.usernameErrors.push(gettext('This username is taken.'));
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

    // if(!registration.email.value && $scope.noEmailWarning == false) {
    //   validInput = false;
    //   $scope.noEmailWarning = true;

    //   // Scroll up to the poptip.
    //   $timeout(function() {
    //     $('html, body').animate({scrollTop: $('.poptip').offset().top - 15}, 400);
    //   }, 20);
    // } else if(registration.email.value && !$scope.data.email) {
    //   validInput = false;
    //   $scope.errors.emailErrors.push('Invalid email address.');
    // }

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
      .then(function() {
        var signingKeys = new SigningKeys();

        return submitRegistration(signingKeys)
          .then(function(response) {
            return createWallet(response, signingKeys);
          });
      })
      .then(function(wallet){
        // Initialize the session with the new wallet.
        session.login(wallet);

        if(session.get('inviteCode')) {
          invites.claim(session.get('inviteCode'))
          .success(function (response) {
            $rootScope.$broadcast('invite-claimed');
          });
        }

        // Take the user to the dashboard.
        $state.go('dashboard');
      });
  });

  function submitRegistration(signingKeys) {
    var data = {
      username: $scope.data.username,
      // email: $scope.data.email,
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

    if (response && response.status == "fail") {
      switch (response.code) {
        case 'already_taken':
          var field = response.data && response.data.field;
          if (field == 'username') {
            $scope.errors.usernameErrors.push(usernameErrorMessages['already_taken']);
          } else if (field == 'email') {
            $scope.errors.emailErrors.push(emailErrorMessages['already_taken']);
          }
          break;
        case 'invalid':
          var field = response.data && response.data.field;
          if (field == 'username') {
            $scope.errors.usernameErrors.push(usernameErrorMessages['invalid']);
          } else if (field == 'email') {
            $scope.errors.emailErrors.push(emailErrorMessages['invalid']);
          }
          break;
        default:
          // TODO: generic error
      }
    } else {
      $scope.errors.usernameErrors.push('Registration error?');
    }
  }

  function createWallet(response, signingKeys) {
    var id = Wallet.deriveId($scope.data.username.toLowerCase(), $scope.data.password);
    var key = Wallet.deriveKey(id, $scope.data.username.toLowerCase(), $scope.data.password);

    var wallet = new Wallet({
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
        server: Options.server
      }
    });

    return tryWalletUpload(wallet)
      .then(function() {
        return wallet;
      });
  }

  function tryWalletUpload(wallet, attempts) {
    attempts = attempts || 0;

    // Upload the new wallet to the server.
    return wallet.sync('create').catch(function(err) {
      if (attempts >= Options.MAX_WALLET_ATTEMPTS) {
        FlashMessages.add({
          title: 'Registration Error',
          info: 'There was an error during registration. Please contact us at hello@stellar.org if the problem persists.',
          type: 'error'
        });

        $http.post(Options.API_SERVER + "/failedRegistration", {
          username: $scope.data.username,
          updateToken: wallet.keychainData.updateToken,
          email: $scope.data.email
        });

        return $q.reject();
      }

      if (attempts == 0) {
        FlashMessages.add({
          title: 'The first attempt to save your wallet failed.',
          info: 'Retrying...',
          type: 'error'
        });
      }

      attempts++;

      // Wait one more second on each attempt.
      var waitTime = attempts * 1000;

      return $timeout(function() {}, waitTime)
        .then(function() {
          return tryWalletUpload(wallet, attempts);
        });
    });
  }
});
