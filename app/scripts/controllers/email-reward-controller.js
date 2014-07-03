'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session) {
  $scope.index = 2;
  $scope.reward = $scope.rewards[$scope.index];

  var action = $scope.reward.action;
  action.message = '';
  action.template = 'templates/verify-email.html';

  action.success = function (event, status) {
    $scope.rewards[$scope.index].status = status;
    $scope.computeRewardProgress();
  };

  $rootScope.$on('emailVerified', action.success);
});
