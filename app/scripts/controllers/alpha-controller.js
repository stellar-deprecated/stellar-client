'use strict';

var sc = angular.module('stellarClient');

sc.controller('AlphaCtrl', function ($scope, $state, session,  bruteRequest) {
  $scope.alphaCode = '';
  $scope.alphaCodeErrors = [];

  var requestAlpha = new bruteRequest({
    url: Options.API_SERVER + '/checkAlphaCode',
    type: 'POST',
    dataType: 'json'
  });

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

            switch (response.status) {
              case 'success':
                // Save code for the registration page
                session.put('alpha', $scope.alphaCode);
                $state.go('register');
                break;

              case 'used':
                $scope.alphaCodeErrors.push('This Alpha Code is already taken.');
                break;

              default:
                $scope.alphaCodeErrors.push('This Alpha Code is invalid.');
            }
          });
        },
        // Fail
        function () {
          $scope.alphaCodeErrors.push('Something is wrong?');
        }
      );
    }
  };
});
