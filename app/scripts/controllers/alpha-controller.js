'use strict';

var sc = angular.module('stellarClient');

sc.controller('AlphaCtrl', function ($scope, $state, $http, session) {
  $scope.alphaCode = '';
  $scope.alphaCodeErrors = [];

  // Remove errors now that the code has changed.
  $scope.clearErrors = function(){
    $scope.alphaCodeErrors = [];
  };

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  $scope.attemptAlpha = function () {
    // Remove any previous error messages.
    $scope.alphaCodeErrors = [];

    var validInput = true;

    if (!$scope.alphaCode) {
      validInput = false;
      $scope.alphaCodeErrors.push('The Alpha Code field is required.');
    }

    if (validInput) {
      var data = {
        alphaCode: $scope.alphaCode
      };
      // Submit the registration data to the server.
      $http.post(Options.API_SERVER + '/user/checkAlphaCode', data)
      .success(
        function (response) {
          // Save code for the registration page
          session.put('alpha', $scope.alphaCode);
          $state.go('register');
      })
      .error(
        function (response) {
          if (response && response.status == 'fail') {
            if (response.code == "validation_error") {
              var error = response.data;
              if (error.code == "already_taken") {
                $scope.alphaCodeErrors.push('This Alpha Code is already taken.');
              } else {
                $scope.alphaCodeErrors.push('This Alpha Code is invalid.');
              }
            }
          } else {
              $scope.alphaCodeErrors.push('An error occured.');
          }
      });
    }
  };
});
