'use strict';

var sc = angular.module('stellarClient');

sc.controller('UsernameRecoveryCtrl', function($rootScope, $scope, $http, $state, $q, singletonPromise, gettextCatalog) {

    $scope.attemptRecovery = singletonPromise(function () {
        if (!$scope.email && recoverform.email.value) {
            $scope.emailError = gettextCatalog.getString("Invalid email");
            return $q.reject();
        } else if (!recoverform.email.value) {
            $scope.emailError = gettextCatalog.getString("Email address required");
            return $q.reject();
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
                $scope.emailError = gettextCatalog.getString("No username with that email");
            } else {
                $scope.emailError = gettextCatalog.getString("Server error");
            }
        })
    });
});