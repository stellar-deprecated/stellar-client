'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationCtrl', function($scope, $state, session, startSession, API_LOCATION, BLOB_LOCATION, BLOB_DEFAULTS, bruteRequest, debounce, passwordStrengthComputations, KeyGen, DataBlob, storeCredentials, saveBlob) {
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
    url: API_LOCATION + '/validname',
    type: 'POST',
    dataType: 'json'
  });

  var requestRegistration = new bruteRequest({
    url: API_LOCATION + '/user',
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
            if(response.status === 'usernameAvailable') {
              $scope.usernameErrors = [];
              $scope.usernameAvailable = true;
            }
            else
            {
              $scope.usernameAvailable = false;
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
  // This does not generate error messages, but will clear them once the input is valid.

  $scope.checkUsername = function(){
    $scope.usernameAvailable = null;
    if($scope.username !== '') checkUsername();
  };

  $scope.checkPassword = function(){
    $scope.passwordValid = (passwordStrengthComputations.getStrength($scope.password) > 50);

    if($scope.passwordValid) $scope.passwordErrors = [];

    $scope.checkConfirmPassword();
  };

  $scope.checkConfirmPassword = function(){
    $scope.passwordConfirmValid = ($scope.password === $scope.passwordConfirmation);

    if($scope.passwordConfirmValid) $scope.passwordConfirmErrors = [];
  };

  // The following functions calculate the classes to be applied to the form.

  $scope.usernameClass = function(){
    var classes = [];

    if($scope.usernameAvailable === null){
      if($scope.username !== '') classes.push('glyphicon-refresh spin');
    }
    else
    {
      classes.push($scope.usernameAvailable ? 'glyphicon-ok' : 'glyphicon-remove');
    }

    return classes.join(' ');
  };

  $scope.passwordConfirmClass = function(){
    var classes = [];

    if($scope.passwordConfirmation == '') classes.push('hidden');
    classes.push($scope.passwordConfirmValid ? 'level4' : 'level1');

    return classes.join(' ');
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
      $scope.usernameErrors.push('The username "' + $scope.username + '" is taken.');
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
      // TODO: Store the keys in the blob.
      var privateKey = 'snoPBgXtMeMyMHUVTrbuqAfr1SUTb';
      var keys = KeyGen.generateKeys(privateKey);
      var packedKeys = KeyGen.pack(keys);

      var data = {
        username: $scope.username,
        email: $scope.email,
        publicKey: packedKeys.pub
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
                blob.put('updateToken', response.updateToken);
                blob.put('walletAuthToken', response.walletAuthToken);

                // Set the default client configuration
                blob.put('server', BLOB_DEFAULTS.server);

                // Save the new blob to the session
                session.put('blob', blob);

                // Store the credentials needed to encrypt and decrypt the blob.
                storeCredentials($scope.username, $scope.password);

                // Initialize the session variables.
                startSession();

                // Encrypt the blob and send it to the server.
                // TODO: Handle failures when trying to save the blob.
                saveBlob();

                // Take the user to the dashboard.
                $state.go('dashboard');
                break;

              case 'nameTaken':
                // Show an error stating the username is already taken.
                $scope.usernameAvailable = false;
                $scope.usernameErrors.push('The username "' + $scope.username + '" is taken.');
                break;

              case 'error':
                // TODO: Show an error.
                break;

              default:
                break;
            }
          });
        },
        // Fail
        function(){
          // TODO: Show an error.
        }
      );
    }
  };
});
