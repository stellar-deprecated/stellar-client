'use strict';
/* global recoverform */
var sc = angular.module('stellarClient');

sc.controller('UsernameRecoveryCtrl', function($rootScope, $scope, $http, $state, $q, singletonPromise, vcRecaptchaService) {

  $scope.recaptchaKey = Options.CAPTCHA_KEY;
  $scope.recaptchaWidgetId = null;
  $scope.onRecaptchaSuccess = function (response) {
    $scope.recaptchaResponse = response;
  };
  $scope.setRecaptchaWidgetId = function (widgetId) {
    $scope.widgetId = widgetId;
  };

    $scope.attemptRecovery = singletonPromise(function () {
        if (!$scope.email && recoverform.email.value) {
            $scope.emailError = "Invalid email";
            return $q.reject();
        } else if (!recoverform.email.value) {
            $scope.emailError = "Email address required";
            return $q.reject();
        }

        var params = {
            email:             $scope.email,
            recaptchaResponse: $scope.recaptchaResponse,
        };
        return $http.post(Options.API_SERVER + "/user/forgotUsername", params)
        .success(function (response) {
            $state.go('login');
            $rootScope.recoveringUsername = true;
        })
        .error(function (response) {
            if (response.code === "not_found") {
                $scope.emailError = "No username with that email";
            } else if (response.code === "captcha") {
                $scope.emailError = response.message;
            } else {
                $scope.emailError = "Server error";
            }
        });
    });
});
