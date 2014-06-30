'use strict';

var sc = angular.module('stellarClient');

sc.controller('CreateRewardCtrl', function ($scope, session) {
  $scope.index = 0;
  $scope.reward = $scope.rewards[$scope.index];

  var action = $scope.reward.action;
});
