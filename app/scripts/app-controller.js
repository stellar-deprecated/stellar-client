'use strict';

var sc = angular.module('stellarClient');

sc.factory('session', function($cacheFactory){
  // A place to store session information that will persist until the user leaves the page.
  return $cacheFactory('session');
});

sc.controller('AppCtrl', function($scope) {

});

sc.controller('NavCtrl', function($scope, session) {
  // The session is initially not logged in.
  session.put('loggedIn',  false);

  // Allow the nav to access the session variables.
  $scope.session = session;
});

sc.factory('storeCredentials', function(session, KeyGen){
  // Expand the user credentials into a key and an ID for the blob,
  // and save them to the session cache.
  return function(username, password){
    // Expand the user's credentials into the key used to encrypt the blob.
    var blobKey = KeyGen.expandCredentials(password, username);

    // Expand the user's credentials into the ID used to encrypt the blob.
    // The blobID must not allow an attacker to compute the blobKey.
    var blobID = sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(KeyGen.expandCredentials(password, blobKey)));

    // Store the username, key, and ID in the session cache.
    // Don't store the password since we no longer need it.
    session.put('username', username);
    session.put('blobKey', blobKey);
    session.put('blobID', blobID);
  };
});

sc.controller('LoginCtrl', function($scope, $state, session, BLOB_LOCATION, DataBlob, storeCredentials) {
  if(session.get('loggedIn')){
    // Log out if the there is an active session.
    session.removeAll();
    session.put('loggedIn', false);
  }

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    storeCredentials($scope.username, $scope.password);

    $.ajax({
      method: 'GET',
      url: BLOB_LOCATION + '/' + session.get('blobID'),
      dataType: 'json',
      success: function(data, status, xhr){
        $scope.$apply(function() {
          if (data) {
            try {
              var blob = new DataBlob();
              blob.decrypt(data.blob, session.get('blobKey'));

              session.put('blob', blob);
              session.put('loggedIn', true);

              $state.go('dashboard');
            } catch (err) {
              // Error decrypting blob.
              $scope.loginError = err;
            }
          } else {
            // No blob found.
            $scope.loginError = 'Invalid username or password.';
          }
        });
      },
      error: function(){
        $scope.$apply(function() {
          // Request failed.
          $scope.loginError = 'Unable to contact the server.';
        });
      }
    });
  };
});

sc.controller('DashboardCtrl', function($scope, $state, session) {
  if(!session.get('loggedIn') || !session.get('blob')){
    $state.go('login');
    return;
  }

  $scope.blob = session.get('blob');
});

sc.controller('RegistrationCtrl', function($scope, $state, session, API_LOCATION, BLOB_LOCATION, bruteRequest, debounce, passwordStrengthComputations, KeyGen, DataBlob, storeCredentials) {
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
      var keys = KeyGen.generateKeys();
      var packedKeys = KeyGen.pack(keys);
      var address = KeyGen.getAddress(packedKeys.pub);

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
                blob.data.email = $scope.email;
                blob.data.packedKeys = packedKeys;
                blob.data.updateToken = response.updateToken;
                blob.data.walletAuthToken = response.walletAuthToken;

                // Save the new blob to the session
                session.put('blob', blob);
                session.put('keys', keys);
                session.put('loggedIn', true);

                // Store the credentials needed to encrypt and decrypt the blob.
                storeCredentials($scope.username, $scope.password);

                // Encrypt the blob and send it to the server.
                // TODO: Handle failures when trying to save the blob.
                $.ajax({
                  url: BLOB_LOCATION + '/' + session.get('blobID'),
                  method: 'POST',
                  data: {blob: blob.encrypt(session.get('blobKey'))},
                  dataType: 'json'
                });

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
