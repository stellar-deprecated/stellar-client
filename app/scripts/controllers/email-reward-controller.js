'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session) {
  $scope.index = 2;
  $scope.reward = $scope.rewards[$scope.index];

  $scope.reward.template = 'templates/verify-email.html';

  $rootScope.$on('emailVerified', function(event, status) {
    $scope.rewards[$scope.index].status = status;
    $scope.updateRewards();
  });
});
