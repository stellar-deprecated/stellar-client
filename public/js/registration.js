angular.module('registration', [])
    .directive('registrationForm', function(){
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            scope: {},
            controller: function ($scope, $element) {
                $scope.publicKey = null;
                $scope.privateKey = null;
                // TODO: Generate the keypair.

                $scope.submitForm = function(){
                    // TODO: Validate form.
                    console.log('registration');
                }
            },
            template:
                '<div id="registration">' +
                    'Sign up:<br>' +
                    '<form id="regForm">' +
                        '<input type="text" name="username" placeholder="Username"><br>' +
                        '<input type="password" name="password" placeholder="Password"><br>' +
                        '<input type="text" name="email" placeholder="Email (optional)"><br>' +
                        // reCaptcha here
                        '<input type="hidden" name="pubkey" value="{{ publicKey }}">' +
                        '<input type="submit" ng-click="submitForm()"></input>' +
                    '</form>' +
                '</div>'
        };
    });
