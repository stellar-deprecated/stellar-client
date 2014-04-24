angular.module('login', [])
    .directive('loginForm', function(){
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            scope: {},
            controller: function ($scope, $element) {
                $scope.submitForm = function(){
                    // TODO: Validate form.
                    console.log('login');
                }
            },
            template:
                '<div id="login">' +
                    'Sign in:<br>' +
                    '<form id="loginForm">' +
                        '<input type="text" name="username" placeholder="Username"><br>' +
                        '<input type="password" name="password" placeholder="Password"><br>' +
                        '<input type="submit" ng-click="submitForm()"></input>' +
                    '</form>' +
                '</div>'
        };
    });
