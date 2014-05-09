'use strict';

var sc = angular.module('stellarClient');

sc.factory('session', function($cacheFactory){
  return $cacheFactory('session');
});

sc.controller('AppCtrl', function($scope) {

});

sc.controller('NavCtrl', function($scope, session) {
  //TODO: figure out how we express the current user to controllers
  $scope.session = session;
  session.put('loggedIn',  false);
});

sc.controller('LoginCtrl', function($scope, $state, session, DataBlob) {
  if(session.get('loggedIn')){
    // Logout
    session.remove('blob');
    session.put('loggedIn', false);
  }

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    //TODO: hash up the passwords
    //      locate the user blob and decrypt
    //      go to dashboard

    if($scope.username === 'stellar') {
      // this is the dummy success state
      session.put('username', $scope.username);
      session.put('password', $scope.password);
      session.put('blob', new DataBlob());
      session.put('loggedIn', true);
      $state.go('dashboard');
    } else {
      // this is the dummy failure state
      // TODO: we should tell them _why_ they failed to login here
      $scope.loginError = 'Error!';
    }
  };
});

sc.controller('DashboardCtrl', function($scope, $state, session) {
  if(!session.get('loggedIn') || !session.get('blob')){
    $state.go('login');
    return;
  }

  $scope.blob = session.get('blob');
});

sc.controller('RegistrationCtrl', function($scope, $state, session, API_LOCATION, bruteRequest, debounce, passwordStrengthComputations, KeyGen, DataBlob) {
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

      requestRegistration.send(data,
        // Success
        function (response) {
          $scope.$apply(function () {
            console.log(response.status);
            switch(response.status)
            {
              case 'nameTaken':
                $scope.usernameAvailable = false;
                $scope.usernameErrors.push('The username "' + $scope.username + '" is taken.');

                break;
              case 'success':
                var blob = new DataBlob();

                blob.data.username = $scope.username;
                blob.data.email = $scope.email;

                blob.data.packedKeys = packedKeys;

                blob.data.updateToken = response.updateToken;
                blob.data.walletAuthToken = response.walletAuthToken;

                session.put('blob', blob);
                session.put('username', $scope.username);
                session.put('password', $scope.password);
                session.put('loggedIn', true);

                $state.go('dashboard');

                break;
              case 'error':
              default:
                break;
            }
          });
        },
        // Fail
        function(){

        }
      );
    }
  };
});
