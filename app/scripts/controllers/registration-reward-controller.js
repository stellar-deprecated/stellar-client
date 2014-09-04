'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationRewardCtrl', function ($scope, session) {
  $scope.reward = {
    rewardType: 0,
    title: 'Create a new wallet!',
    subtitle: 'Complete registration',
    innerTitle: 'Create a new wallet',
    status: 'sent'
  };

  $scope.rewards[$scope.reward.rewardType] = $scope.reward;
});
