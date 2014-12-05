'use strict';

var sc = angular.module('stellarClient');

sc.controller('ServerStatusCtrl', function ($scope, $q, stellarApi) {
  $scope.status = null;

  stellarApi.getStatus()
    .then(function(status) {
      $scope.status = status;
    });
});