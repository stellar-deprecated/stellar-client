'use strict';

var sc = angular.module('stellarClient');

sc.controller('UsernameRecoveryCtrl', function($scope, $http, $state) {

    $scope.attemptRecovery = function () {
        if ($scope.recovering) {
            return;
        }
        if (!$scope.email && recoverform.email.value) {
            $scope.emailError = "Invalid email";
        } else if (!recoverform.email.value) {
            return;
        }

        $scope.recovering;

        var config = {
            params: {
                email: $scope.email
            }
        }
        $http.get(Options.API_SERVER + "/user/forgotUsername", config)
        .success(function (response) {
            $state.go('login');
            location.search = 'recovery';
        })
        .error(function (response) {
            if (response.code == "not_found") {
                $scope.emailError = "No username with that email";
            } else {
                $scope.emailError = "Server error";
            }
        })
    }
});