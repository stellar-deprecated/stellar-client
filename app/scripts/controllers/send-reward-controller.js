'use strict';

var sc = angular.module('stellarClient');

sc.controller('SendRewardCtrl', function ($scope, session) {
  $scope.index = 3;
  $scope.reward = $scope.rewards[$scope.index];

  $scope.reward.template = 'templates/send-stellar.html';
});
