'use strict';

var sc = angular.module('stellarClient');

sc.controller('AlphaCtrl', function ($scope, $state, $http, $q, session, singletonPromise) {
  $scope.alphaCode = '';
  $scope.alphaCodeError = '';

  // Remove errors now that the code has changed.
  $scope.clearErrors = function(){
    $scope.alphaCodeError = '';
  };

  $scope.validateInput = function(){
    // Remove any previous error messages.
    $scope.clearErrors();
    var validInput = true;

    if (!$scope.alphaCode) {
      validInput = false;
      $scope.alphaCodeError = 'The Alpha Code field is required.';
      return $q.reject();
    }

    return $q.when();
  };

  function submitAlphaCode(){
    var data = {
      alphaCode: $scope.alphaCode
    };

    // Submit the registration data to the server.
    return $http.post(Options.API_SERVER + '/user/checkAlphaCode', data)
      .success(function (response) {
        // Save code for the registration page
        session.put('alpha', $scope.alphaCode);
        $state.go('register');
      })
      .error(function (response) {
        if (response && response.status == 'fail') {
          if (response.code == "already_taken") {
            $scope.alphaCodeError = 'This Alpha Code is already taken.';
          } else if (response.code == "invalid") {
            $scope.alphaCodeError = 'This Alpha Code is invalid.';
          }
        } else {
          $scope.alphaCodeError = 'An error occured.';
        }
      });
  }

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  $scope.attemptAlpha = singletonPromise(function() {
    return $scope.validateInput().then(submitAlphaCode);
  });
});
