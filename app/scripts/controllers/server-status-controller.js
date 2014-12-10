'use strict';

var sc = angular.module('stellarClient');

sc.controller('ServerStatusCtrl', function ($scope, $q, stellarApi) {
  $scope.status = null;

  stellarApi.getStatus()
    .success(function(status) {
      $scope.status = status;
    });
});
