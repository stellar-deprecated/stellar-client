'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($scope, $state, session, bruteRequest, debounce, passwordStrengthComputations, KeyGen, DataBlob) {
  $scope.username             = '';
  $scope.email                = '';
  $scope.password             = '';
  $scope.passwordConfirmation = '';

  $scope.usernameAvailable    = null;
  $scope.passwordValid        = null;
  $scope.passwordConfirmValid = null;

  $scope.usernameErrors        = [];
  $scope.passwordErrors        = [];
  $scope.passwordConfirmErrors = [];

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
    if($scope.username === '') $scope.usernameAvailable = null;
    else{
      requestUsernameStatus.send({username: $scope.username},
        // Success
        function (response) {
          $scope.$apply(function(){
            console.log(response.status);
            switch (response.status) {
              case "success":
                $scope.usernameAvailable = true;
                break;
              case "fail":
                if (response.code == "already_taken") {
                  $scope.usernameErrors.push('This username is taken.');
                  $scope.usernameAvailable = false;
                  break;
                }
              case "error":
                // TODO: show an error
            }
          });
        },
        // Fail
        function(){
          // TODO: Show an error.
        }
      );
    }
  });

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
    if(strength <= 25) return 'WEAK';
    if(strength <= 50) return 'OK';
    if(strength <= 75) return 'GOOD';
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
      var keys = KeyGen.generateKeys();
      var packedKeys = KeyGen.pack(keys);

      // TODO: Don't spoof the address.
      packedKeys.address = 'gHb9CJAWyB4gj91VRWn96DkukG4bwdtyTh';

      var data = {
        alphaCode: session.get('alpha'),
        username: $scope.username,
        email: $scope.email,
        address: packedKeys.address
      };

      // Submit the registration data to the server.
      requestRegistration.send(data,
        // Success
        function (response) {
          $scope.$apply(function () {
            console.log(response.status);
            switch(response.status)
            {
              case 'success':
                // Create the initial blob and insert the user's data.
                var blob = new DataBlob();
                blob.put('username', $scope.username);
                blob.put('email', $scope.email);
                blob.put('packedKeys', packedKeys);
                blob.put('updateToken', response.data.updateToken);
                blob.put('walletAuthToken', response.data.walletAuthToken);

                // Set the default client configuration
                blob.put('server', Options.server);

                // Save the new blob to the session
                session.put('blob', blob);

                // Store the credentials needed to encrypt and decrypt the blob.
                session.storeCredentials($scope.username, $scope.password);

                // Initialize the session variables.
                session.start();

                // Encrypt the blob and send it to the server.
                // TODO: Handle failures when trying to save the blob.
                session.storeBlob();

                // Connect to the websocket server.
                $scope.$broadcast('$idAccountLoad', {account: packedKeys.address, secret: packedKeys.sec});

                // Take the user to the dashboard.
                $state.go('dashboard');
                break;

              case 'fail':
                switch (response.code) {
                  case 'validation_error':
                    // TODO: iterate through the validation errors when we add server side validation
                    var error = response.data;
                    if (error.field == "username" && error.code == "already_taken") {
                      // Show an error stating the username is already taken.
                      $scope.usernameAvailable = false;
                      $scope.usernameErrors.push('The username "' + $scope.username + '" is taken.');
                    } else if (error.field == "alpha_code" && error.code == "already_taken") {
                      // TODO: ux for alpha code has already been used
                    } else if (error.field == "alpha_code" && error.code == "invalid") {
                      // TODO: ux for alpha code is invalid
                    }
                    break;
                  default:
                    break;
                }
                break;
              case 'error':
                  $scope.usernameErrors.push('Registration error?');
                break;

              default:
                  $scope.usernameErrors.push('Unknown response.');
                break;
            }
          });
        },
        // Fail
        function(){
            $scope.usernameErrors.push('Something is wrong?');
        }
      );
    }
  };
});
