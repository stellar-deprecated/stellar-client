'use strict';

var sc = angular.module('stellarClient');

sc.controller('PasswordCtrl', function($scope, passwordStrengthComputations, $translate) {
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
    if(strength < 25) return $translate.instant('password.strength_weak').toUpperCase();
    if(strength < 50) return $translate.instant('password.strength_almost').toUpperCase();
    if(strength < 75) return $translate.instant('password.strength_good').toUpperCase();
    return $translate.instant('password.strength_strong').toUpperCase();
  };

  // Validate the passwords are valid and matching.
  function validateInput() {
    // Remove any previous error messages.
    $scope.errors.passwordErrors        = [];
    $scope.errors.passwordConfirmErrors = [];

    var validInput = true;

    if(!$scope.data.password){
      validInput = false;
      $scope.errors.passwordErrors.push($translate.instant('password.password_required'));
    }
    else if(!$scope.status.passwordValid){
      validInput = false;
      $scope.errors.passwordErrors.push($translate.instant('password.password_not_strong'));
    }
    else if(!$scope.status.passwordConfirmValid){
      validInput = false;
      $scope.errors.passwordConfirmErrors.push($translate.instant('password.passwords_not_match'));
    }

    return validInput;
  }

  $scope.validators.push(validateInput);
});
