'use strict';

var sc = angular.module('stellarClient');

sc.controller('UsernameRecoveryCtrl', function($rootScope, $scope, $http, $state, singletonPromise, $translate) {

    $scope.attemptRecovery = singletonPromise(function () {
        if (!$scope.email && recoverform.email.value) {
            $scope.emailError = $translate.instant('username_recovery.invalid_email');
            return;
        } else if (!recoverform.email.value) {
            $scope.emailError = $translate.instant('username_recovery.email_required');
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
                $scope.emailError = $translate.instant('username_recovery.no_username_with_that_email');
            } else {
                $scope.emailError = $translate.instant('global.server_error');
            }
        })
    });
});