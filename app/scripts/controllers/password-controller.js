'use strict';

var sc = angular.module('stellarClient');

sc.controller('PasswordCtrl', function($scope) {  
  $scope.loading = false;
  $scope.passwordConfirmation = '';

  $scope.checkPassword = function(){
    $scope.errors.passwordErrors = [];
    $scope.status.passwordValid = (zxcvbn($scope.data.password).score > 3);
    $scope.checkConfirmPassword();
  };

  $scope.checkConfirmPassword = function(){
    $scope.status.passwordConfirmValid = ($scope.data.password === $scope.data.passwordConfirmation);

    if($scope.status.passwordConfirmValid) {
      $scope.errors.passwordConfirmErrors = [];
    }
  };

  $scope.passwordClass = function(){
    return $scope.status.passwordValid ? 'glyphicon-ok' : 'glyphicon-none';
  };

  $scope.confirmPasswordClass = function(){
    if($scope.status.passwordConfirmValid) {
      return 'glyphicon-ok';
    } else {
      var passwordPrefix = $scope.data.password.slice(0, $scope.data.passwordConfirmation.length);
      return $scope.data.passwordConfirmation !== passwordPrefix ? 'glyphicon-remove' : 'glyphicon-none';
    }
  };

  $scope.passwordStrength = function(){
    if(!$scope.data.password) { return ''; }

    var strength = zxcvbn($scope.data.password).score;
    if(strength < 2) { return 'WEAK'; }
    if(strength < 3) { return 'ALMOST'; }
    if(strength < 4) { return 'GOOD'; }
    return 'STRONG';
  };

  // Validate the passwords are valid and matching.
  function validateInput() {
    // Remove any previous error messages.
    $scope.errors.passwordErrors        = [];
    $scope.errors.passwordConfirmErrors = [];

    var validInput = true;

    if(!$scope.data.password){
      validInput = false;
      $scope.errors.passwordErrors.push('The password field is required.');
    }
    else if(!$scope.status.passwordValid){
      validInput = false;
      $scope.errors.passwordErrors.push('The password is not strong enough.');
    }
    else if(!$scope.status.passwordConfirmValid){
      validInput = false;
      $scope.errors.passwordConfirmErrors.push('The passwords do not match.');
    }

    return validInput;
  }

  $scope.validators.push(validateInput);
});
