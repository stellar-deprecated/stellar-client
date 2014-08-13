'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($scope, $state, $stateParams, $timeout, $http, $q, session, debounce, singletonPromise, Wallet, FlashMessages, $translate) {
  // Provide a default value to protect against stale config files.
  Options.MAX_WALLET_ATTEMPTS = Options.MAX_WALLET_ATTEMPTS || 3;

  $scope.data = {
    username:             '',
    email:                '',
    password:             '',
    passwordConfirmation: '',
    inviteCode:           $stateParams.inviteCode
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
          $scope.status.usernameAvailable = true;
        })
      .error(
        function (response){
          switch(response && response.code) {
            case 'already_taken':
              $scope.errors.usernameErrors.push($translate.instant('register.username_taken'));
              $scope.status.usernameAvailable = false;
              break;
            default:
              $scope.errors.usernameErrors.push($translate.instant('register.error_occurred'));
              $scope.status.usernameAvailable = null;
          }
        });
    }
  });

  function getUsernameError(username) {
    if (username.length < 3 || username.length > 20) {
      return $translate.instant('register.username_length_constraint', {min: 3, max: 20});
    }
     if(!username.match(/^[a-zA-Z0-9].*[a-zA-Z0-9]$/))
     {
         return $translate.instant('register.username_start_end_constraint');
     }
    if (!username.match(/^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*$/)) {
      //return "Must start and end with a letter, and may contain \".\", \"_\", or \"-\"";
        return $translate.instant('register.username_chars_constraint');
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
      $scope.errors.usernameErrors.push($translate.instant('register.username_field_required'));
    }
    else if($scope.status.usernameAvailable === false){
      validInput = false;
      $scope.errors.usernameErrors.push($translate.instant('register.username_taken'));
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
      .then(ensureEntropy)
      .then(submitRegistration)
      .then(createWallet)
      .then(function(){
        // Initialize the session with the new wallet.
        session.login(wallet);

        // Take the user to the dashboard.
        $state.go('dashboard');
      });
  });


  /**
   * Seed the sjcl random function with Math.random() in the case where we are
   * on a crappy browser (IE) and we've yet to get enough entropy from the
   * sjcl entropy collector.
   *
   * it sucks, but this is our last minute fix for IE support.  Our fix going
   * forward will be to use window.msCrypto on ie11, and on ie10 request
   * some mouse movement from the user (maybe?).
   *
   */
  function ensureEntropy() {
    var deferred = $q.defer();

    var isEnough = function() {
      return sjcl.random.isReady() !== sjcl.random._NOT_READY;
    }

    if(isEnough()){
      deferred.resolve();
      return deferred.promise;
    }

    for (var i = 0; i < 8; i++) {
      sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
    }

    if(isEnough()){
      deferred.resolve();
    } else {
      $scope.errors.usernameErrors.push($translate.instant('register.could_not_get_entropy'));
      deferred.reject();
    }

    return deferred.promise;
  }

  function submitRegistration() {
    signingKeys = new SigningKeys();

    var data = {
      username: $scope.data.username,
      // email: $scope.data.email,
      address: signingKeys.address,
      inviteCode: $scope.data.inviteCode
    };

    // Submit the registration data to the server.
    return $http.post(Options.API_SERVER + '/user/register', data)
      .error(showRegistrationErrors);
  }

  function showRegistrationErrors(response) {
    var usernameErrorMessages = {
      'already_taken': $translate.instant('register.username_taken'),
      'invalid': $translate.instant('register.username_start_end_constraint')
    };

    var emailErrorMessages = {
      'already_taken': $translate.instant('register.email_taken'),
      'invalid': $translate.instant('register.email_invalid')
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
        server: Options.server
      }
    });

    return tryWalletUpload(wallet);
  }

  function tryWalletUpload(wallet, attempts) {
    attempts = attempts || 0;

    // Upload the new wallet to the server.
    return wallet.sync('create').catch(function(err) {
      if (attempts >= Options.MAX_WALLET_ATTEMPTS) {
        FlashMessages.add({
          title: $translate.instant('register.registration_error'),
          info: $translate.instant('register.registration_error_info', {email: 'hello@stellar.org'}),
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
          title: $translate.instant('register.first_attempt_walled_save_failed'),
          info: $translate.instant('register.retrying'),
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
