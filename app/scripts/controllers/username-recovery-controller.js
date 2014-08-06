'use strict';

var sc = angular.module('stellarClient');

sc.controller('UsernameRecoveryCtrl', function($rootScope, $scope, $http, $state, singletonPromise) {

    $scope.attemptRecovery = singletonPromise(function () {
        if (!$scope.email && recoverform.email.value) {
            $scope.emailError = "Invalid email";
            return;
        } else if (!recoverform.email.value) {
            $scope.emailError = "Email address required";
            return;
        }

        var config = {
            params: {
                email: $scope.email
            }
        }
        return $http.get(Options.API_SERVER + "/user/forgotUsername", config)
        .success(function (response) {
            $state.go('login');
            $rootScope.recoveringUsername = true;
        })
        .error(function (response) {
            if (response.code == "not_found") {
                $scope.emailError = "No username with that email";
            } else {
                $scope.emailError = "Server error";
            }
        })
    });
});