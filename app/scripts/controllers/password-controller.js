'use strict';

var sc = angular.module('stellarClient');

sc.controller('PasswordCtrl', function($scope, passwordStrengthComputations, badPasswords, gettextCatalog) {
  $scope.loading = false;
  $scope.passwordConfirmation = '';
  $scope.minChars = 8;

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

  passwordStrengthComputations.aspects.sameAsUsername = {
    weight: 1,
    strength: function(password) {
      return $scope.data.username === password ? -1000 : 0
    }
  }

  passwordStrengthComputations.aspects.dictionary = {
    weight: 1,
    strength: function(password) {
      return badPasswords.contains(password) ? -1000 : 0
    }
  }

  $scope.checkPassword = function(){
    $scope.errors.passwordErrors = [];
    $scope.status.passwordValid = (passwordStrengthComputations.getStrength($scope.data.password) > 50);
    $scope.checkConfirmPassword();
  };

  $scope.checkConfirmPassword = function(){
    $scope.status.passwordConfirmValid = ($scope.data.password === $scope.data.passwordConfirmation);

    if($scope.status.passwordConfirmValid) $scope.errors.passwordConfirmErrors = [];
  };

  $scope.passwordClass = function(){
    if($scope.status.passwordValid) return 'glyphicon-ok';
    else return 'glyphicon-none';
  };

  $scope.confirmPasswordClass = function(){
    if($scope.status.passwordConfirmValid) return 'glyphicon-ok';
    else {
      var passwordPrefix = $scope.data.password.slice(0, $scope.data.passwordConfirmation.length);
      if ($scope.data.passwordConfirmation != passwordPrefix) return 'glyphicon-remove';
      else return 'glyphicon-none';
    }
  };

  $scope.passwordStrength = function(){
    if(!$scope.data.password) return '';

    var strength = passwordStrengthComputations.getStrength($scope.data.password);
    /// Password strength
    if(strength < 25) return gettextCatalog.getString('Weak').toUpperCase();
    /// Password strength
    if(strength < 50) return gettextCatalog.getString('Almost').toUpperCase();
    /// Password strength
    if(strength < 75) return gettextCatalog.getString('Good').toUpperCase();
    return gettextCatalog.getString('Strong').toUpperCase();
  };

  // Validate the passwords are valid and matching.
  function validateInput() {
    // Remove any previous error messages.
    $scope.errors.passwordErrors        = [];
    $scope.errors.passwordConfirmErrors = [];

    var validInput = true;

    if(!$scope.data.password){
      validInput = false;
      $scope.errors.passwordErrors.push(gettextCatalog.getString('The password field is required.'));
    }
    else if(!$scope.status.passwordValid){
      validInput = false;
      $scope.errors.passwordErrors.push(gettextCatalog.getString('The password is not strong enough.'));
    }
    else if(!$scope.status.passwordConfirmValid){
      validInput = false;
      $scope.errors.passwordConfirmErrors.push(gettextCatalog.getString('The passwords do not match.'));
    }

    return validInput;
  }

  $scope.validators.push(validateInput);
});
