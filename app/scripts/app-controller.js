'use strict';

var sc = angular.module('stellarClient');

sc.controller('AppCtrl', function($scope) {
  
});

sc.controller('NavCtrl', function($scope) {
  //TODO: figure out how we express the current user to controllers

  $scope.loggedIn = false;
});

sc.controller('LoginCtrl', function($scope, $state) {
  $scope.email      = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    //TODO: hash up the passwords
    //      locate the user blob and decrypt
    //      go to dashboard

    if($scope.email === "success@example.com") {
      // this is the dummy success state
      $state.go("dashboard");
    } else {
      // this is the dummy failure state
      // TODO: we should tell them _why_ they failed to login here
      $scope.loginError = "Error!"
    }
  }
});
