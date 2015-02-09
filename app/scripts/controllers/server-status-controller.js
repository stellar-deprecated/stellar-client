'use strict';

var sc = angular.module('stellarClient');

sc.controller('ServerStatusCtrl', function ($scope, $q, $http) {
  $scope.status = null;

  $http.get('/status.json')
    .success(function(status) {
      $scope.status = status
    })
    .catch(function () {});
});
