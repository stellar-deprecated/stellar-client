'use strict';

var sc = angular.module('stellarClient');

sc.controller('AlphaCtrl', function ($scope, $state, session,  bruteRequest) {
  $scope.alphaCode = '';
  $scope.alphaCodeErrors = [];

  var requestAlpha = new bruteRequest({
    url: Options.API_SERVER + '/user/checkAlphaCode',
    type: 'POST',
    dataType: 'json'
  });

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
      requestAlpha.send(data,
        // Success
        function (response) {
          $scope.$apply(function () {
            console.log('Alpha code: ' + response.status);
            // Save code for the registration page
            session.put('alpha', $scope.alphaCode);
            $state.go('register');
          });
        },
        function (response) {
          $scope.$apply(function () {
            var responseJSON = response.responseJSON;
            if (responseJSON && responseJSON.status == 'fail') {
              if (responseJSON.code == "validation_error") {
                var error = responseJSON.data;
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
      );
    }
  };
});
