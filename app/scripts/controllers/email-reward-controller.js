'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session, $translate) {
  $scope.reward = {
    rewardType: 2,
    title: null, // Waiting for translations to load
    subtitle: null,
    innerTitle: null,
    status: 'incomplete',
    updateReward: function (status) {
      $scope.reward.status = status;
    }
  };

  $translate(['rewards.set_up_password_recovery', 'rewards.verify_your_email'])
    .then(function(translations) {
      $scope.reward.title = translations['rewards.set_up_password_recovery'];
      $scope.reward.subtitle = translations['rewards.verify_your_email'];
      $scope.reward.innerTitle = translations['rewards.set_up_password_recovery'];
    });

  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  $scope.reward.template = 'templates/verify-email.html';

  $rootScope.$on('emailVerified', function(event, status) {
    $scope.reward.status = status;
    $scope.updateRewards();
  });
});
