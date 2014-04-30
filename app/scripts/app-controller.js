'use strict';

var sc = angular.module('stellarClient');

sc.controller('AppCtrl', function($scope) {
  
});

sc.controller('NavCtrl', function($scope) {
  //TODO: figure out how we express the current user to controllers
  $scope.loggedIn = false;
});

sc.controller('LoginCtrl', function($scope, $state) {
  $scope.email      = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    //TODO: hash up the passwords
    //      locate the user blob and decrypt
    //      go to dashboard

    if($scope.email === 'success@example.com') {
      // this is the dummy success state
      $state.go('dashboard');
    } else {
      // this is the dummy failure state
      // TODO: we should tell them _why_ they failed to login here
      $scope.loginError = 'Error!';
    }
  };
});

sc.controller('RegistrationCtrl', function($scope, $state, debounce, passwordStrengthComputations) {
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

  // Checks to see if the supplied username is available.
  // This function is debounced to prevent API calls before the user is finished typing.
  var checkUsername = debounce(500, function(){
    if($scope.username === '') $scope.usernameAvailable = null;
    else
    {
      //TODO: Check API to see if the user name is already taken.
      if($scope.username === 'stellar') {
        $scope.usernameErrors = [];
        $scope.usernameAvailable = true;
      }
      else
      {
        $scope.usernameAvailable = false;
      }
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
    else if(!$scope.usernameAvailable){
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
      //TODO: hash up the passwords
      //      locate the user blob and decrypt
      //      go to dashboard

      // this is the dummy success state
      $state.go('dashboard');
    }
  };
});
