'use strict';

var sc = angular.module('stellarClient');

sc.controller('AlphaCtrl', function($scope, $state, session, API_LOCATION, bruteRequest ) {
    $scope.alphaCode            = '';
    $scope.alphaCodeErrors       = [];

    var requestRegistration = new bruteRequest({
        url: API_LOCATION + '/checkAlphaCode',
        type: 'POST',
        dataType: 'json'
    });

    // Validate the input before submitting the registration form.
    // This generates messages that help the user resolve their errors.
    $scope.attemptAlpha = function() {
        // Remove any previous error messages.
        $scope.alphaCodeErrors = [];

        var validInput = true;

        if(!$scope.alphaCode){
            validInput = false;
            $scope.usernameErrors.push('The Alpha Code field is required.');
        }

        if(validInput){
            var data = {
                code: $scope.alphaCode
            };

            // Submit the registration data to the server.
            requestRegistration.send(data,
                // Success
                function (response) {
                    $scope.$apply(function () {
                        console.log(response.status);
                        switch(response.status)
                        {
                            case 'success':
                                // Save code for the registration page
                                session.put('alpha', $scope.alphaCode);
                                $state.go('register');
                                break;

                            case 'used':
                                $scope.usernameErrors.push('Sorry this code has already been used.');
                                break;

                            default:
                                $scope.usernameErrors.push('Sorry this code is invalid.');
                                break;
                        }
                    });
                },
                // Fail
                function(){
                    $scope.usernameErrors.push('Something is wrong?');
                }
            );
        }
    };
});
