'use strict';

var sc = angular.module('stellarClient');

sc.controller('ClaimFlashMessageCtrl', function ($scope, $rootScope) {
  $scope.claimRewards = function() {
    $rootScope.$broadcast("claimRewards");
  }
});
