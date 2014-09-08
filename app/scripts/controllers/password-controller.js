'use strict';

var sc = angular.module('stellarClient');

sc.controller('PasswordCtrl', function($scope, passwordStrengthComputations, badPasswords) {  
  $scope.loading = false;
  $scope.passwordConfirmation = '';

  // Remove default password requirements.
  delete passwordStrengthComputations.aspects.minimumLength;
  delete passwordStrengthComputations.aspects.uppercaseLetters;
  delete passwordStrengthComputations.aspects.lowercaseLetters;
  delete passwordStrengthComputations.aspects.numbers;
  delete passwordStrengthComputations.aspects.duplicates;
  delete passwordStrengthComputations.aspects.consecutive;
  delete passwordStrengthComputations.aspects.dictionary;
  delete passwordStrengthComputations.aspects.symbols;

  // Enforce 8 character minimum.
  passwordStrengthComputations.aspects.minLength = {
    weight: 100,
    strength: function(password){
      var minLength = 8;
      if(password.length < minLength/2) { return 25; }
      if(password.length < minLength)   { return 50; }
      if(password.length < 2*minLength) { return 75; }
      return 100;
    }
  };

  passwordStrengthComputations.aspects.sameAsUsername = {
    weight: 1,
    strength: function(password) {
      return $scope.data.username === password ? -1000 : 0;
    }
  };

  passwordStrengthComputations.aspects.dictionary = {
    weight: 1,
    strength: function(password) {
      return badPasswords.contains(password) ? -1000 : 0;
    }
  };

  $scope.checkPassword = function(){
    $scope.errors.passwordErrors = [];
    $scope.status.passwordValid = (passwordStrengthComputations.getStrength($scope.data.password) > 50);
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

    var strength = passwordStrengthComputations.getStrength($scope.data.password);
    if(strength < 25) { return 'WEAK'; }
    if(strength < 50) { return 'ALMOST'; }
    if(strength < 75) { return 'GOOD'; }
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
