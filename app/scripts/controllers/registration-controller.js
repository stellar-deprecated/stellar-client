'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($scope, $state, session, bruteRequest, debounce, passwordStrengthComputations) {
  $scope.username             = '';
  $scope.email                = '';
  $scope.password             = '';
  $scope.passwordConfirmation = '';

  $scope.usernameAvailable    = null;
  $scope.emailAvailable       = null;
  $scope.passwordValid        = null;
  $scope.passwordConfirmValid = null;

  $scope.usernameErrors        = [];
  $scope.emailErrors           = [];
  $scope.passwordErrors        = [];
  $scope.passwordConfirmErrors = [];

  // Remove default password requirements.
  delete passwordStrengthComputations.aspects.minimumLength;
  delete passwordStrengthComputations.aspects.uppercaseLetters;
  delete passwordStrengthComputations.aspects.lowercaseLetters;
  delete passwordStrengthComputations.aspects.numbers;
  delete passwordStrengthComputations.aspects.duplicates;
  delete passwordStrengthComputations.aspects.consecutive;
  delete passwordStrengthComputations.aspects.dictionary;

  // Enforce 8 character minimum.
  passwordStrengthComputations.aspects.minLength = {
    weight: 100,
    strength: function(password){
      var minLength = 8;
      if(password.length < minLength/2) return 25;
      if(password.length < minLength) return 50;
      if(password.length < 2*minLength) return 75;
      return 100;
    }
  };

  var requestUsernameStatus = new bruteRequest({
    url: Options.API_SERVER + '/user/validname',
    type: 'POST',
    dataType: 'json'
  });

  var requestRegistration = new bruteRequest({
    url: Options.API_SERVER + '/user/register',
    type: 'POST',
    dataType: 'json'
  });

  // Checks to see if the supplied username is available.
  // This function is debounced to prevent API calls before the user is finished typing.
  var checkUsername = debounce(2000, function(){
    if ($scope.username === '') {
      $scope.usernameAvailable = null;
    } else {
      var error = getUsernameError($scope.username);
      if (error) {
        $scope.usernameErrors.push(error);
        $scope.usernameAvailable = false;
        return;
      }
      requestUsernameStatus.send({username: $scope.username},
        // Success
        function (response) {
          $scope.$apply(function(){
            console.log(response.status);
            $scope.usernameAvailable = true;
          });
        },
        // Fail
        function (response){
          $scope.$apply(function() {
            var responseJSON = response.responseJSON;
            switch(responseJSON && responseJSON.code) {
              case 'already_taken':
                $scope.usernameErrors.push('This username is taken.');
                $scope.usernameAvailable = false;
                break;
              default:
                $scope.usernameErrors.push('An error occurred.');
                $scope.usernameAvailable = null;
            }
          });
        }
      );
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
    $scope.usernameErrors = [];
    $scope.usernameAvailable = null;

    if($scope.username !== '') checkUsername();
  };

  $scope.checkPassword = function(){
    $scope.passwordErrors = [];
    $scope.passwordValid = (passwordStrengthComputations.getStrength($scope.password) > 50);

    $scope.checkConfirmPassword();
  };

  $scope.checkConfirmPassword = function(){
    $scope.passwordConfirmValid = ($scope.password === $scope.passwordConfirmation);

    if($scope.passwordConfirmValid) $scope.passwordConfirmErrors = [];
  };

  // The following functions calculate the classes to be applied to the form.

  $scope.usernameClass = function(){
    if($scope.usernameAvailable === null){
      if($scope.username !== '') return 'glyphicon-refresh spin';
      else return 'glyphicon-none';
    }

    else return $scope.usernameAvailable ? 'glyphicon-ok' : 'glyphicon-remove';
  };

  $scope.passwordClass = function(){
    if($scope.passwordValid) return 'glyphicon-ok';
    else return 'glyphicon-none';
  };

  $scope.confirmPasswordClass = function(){
    if($scope.passwordConfirmValid) return 'glyphicon-ok';
    else {
      var passwordPrefix = $scope.password.slice(0, $scope.passwordConfirmation.length);
      if ($scope.passwordConfirmation != passwordPrefix) return 'glyphicon-remove';
      else return 'glyphicon-none';
    }
  };

  $scope.passwordStrength = function(){
    if(!$scope.password) return '';

    var strength = passwordStrengthComputations.getStrength($scope.password);
    if(strength < 25) return 'WEAK';
    if(strength < 50) return 'ALMOST';
    if(strength < 75) return 'GOOD';
    return 'STRONG';
  };

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  $scope.attemptRegistration = function() {
    // Remove any previous error messages.
    $scope.usernameErrors        = [];
    $scope.passwordErrors        = [];
    $scope.passwordConfirmErrors = [];

    var validInput = true;

    if(!$scope.username){
      validInput = false;
      $scope.usernameErrors.push('The username field is required.');
    }
    else if($scope.usernameAvailable === false){
      validInput = false;
      $scope.usernameErrors.push('This username is taken.');
    }

    if(!$scope.password){
      validInput = false;
      $scope.passwordErrors.push('The password field is required.');
    }
    else if(!$scope.passwordValid){
      validInput = false;
      $scope.passwordErrors.push('The password is not strong enough.');
    }
    else if(!$scope.passwordConfirmValid){
      validInput = false;
      $scope.passwordConfirmErrors.push('The passwords do not match.');
    }

    if(validInput){
      var signingKeys = StellarWallet.generate();

      // Keep this to spoof the address.
      // packedKeys.address = 'gHb9CJAWyB4gj91VRWn96DkukG4bwdtyTh';

      var data = {
        alphaCode: session.get('alpha'),
        username: $scope.username,
        email: $scope.email,
        address: signingKeys.address
      };

      // Submit the registration data to the server.
      requestRegistration.send(data,
        // Success
        function (response) {
          $scope.$apply(function () {
            console.log(response.status);

            var id = Wallet.deriveId($scope.username.toLowerCase(), $scope.password);
            var key = Wallet.deriveKey(id, $scope.username.toLowerCase(), $scope.password);

            var wallet = new Wallet({
              id: id,
              key: key,
              recoveryId: response.data.recoveryId,
              keychainData: {
                authToken: response.data.authToken,
                updateToken: response.data.updateToken,
                signingKeys: signingKeys
              },
              mainData: {
                username: $scope.username,
                email: $scope.email,
                server: Options.server
              }
            });

            // Upload the new wallet to the server.
            session.syncWallet(wallet, 'create');

            // Initialize the session with the new wallet.
            session.login(wallet);

            // Take the user to the dashboard.
            $state.go('dashboard');
          });
        },
        // Fail
        function (response) {
          var responseJSON = response.responseJSON;
          if (responseJSON && responseJSON.status == "fail") {
            if (responseJSON.code == "validation_error") {
              // TODO: iterate through the validation errors when we add server side validation
              var error = responseJSON.data;
              if (error.field == "username" && error.code == "already_taken") {
                // Show an error stating the username is already taken.
                $scope.usernameAvailable = false;
                $scope.usernameErrors.push('The username "' + $scope.username + '" is taken.');
              } else if (error.field == "username" && error.code == "invalid") {
                $scope.usernameErrors.push("Username must start and end with a letter, and may contain \".\", \"_\", or \"-\"");
              } else if (error.field == "email" && error.code == "already_taken") {
                $scope.emailErrors.push('The email is taken.');
              } else if (error.field == "email" && error.code == "invalid") {
                $scope.emailErrors.push('The email is invalid.');
              } else if (error.field == "alpha_code" && error.code == "already_taken") {
                // TODO: ux for alpha code has already been used
              } else if (error.field == "alpha_code" && error.code == "invalid") {
                // TODO: ux for alpha code is invalid
              }
            }
          } else {
            $scope.usernameErrors.push('Registration error?');
          }
        }
      );
    }
  };
});
