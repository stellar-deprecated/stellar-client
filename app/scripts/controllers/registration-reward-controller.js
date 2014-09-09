'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationRewardCtrl', function ($scope, session) {
  $scope.reward = {
    rewardType: 0,
    status: 'sent',
    innerTitle: 'Create a new wallet',
    getCopy: function() {
      return {
        title: 'Create a new wallet!',
        subtitle: 'Complete registration',
      };
    }
  };

  $scope.rewards[$scope.reward.rewardType] = $scope.reward;
});
