'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session) {
  $scope.reward = {
    rewardType: 2,
    status: 'incomplete',
    innerTitle: 'Set up password recovery',
    getCopy: function() {
      switch ($scope.reward.status) {
        case 'unverified':
          // User put in email but hasn't put in recovery code
          return {
            title: 'Set up password recovery!',
            subtitle: 'Enter your recovery code to complete'
          };
        case 'needs_fbauth':
        case 'sending':
        case 'sent':
          // User needs to fb auth before they can get their stellars (when they're done, still show this message)
          return {
            title: 'Password recovery activated',
            subtitle: 'Log in with Facebook to receive stellars'
          };
        default:
          return {
            title: 'Set up password recovery!',
            subtitle: 'Verify your email'
          };
      }
    },
    updateReward: function (status) {
      $scope.reward.status = status;
    }
  };
  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  $scope.reward.template = 'templates/verify-email.html';

  $rootScope.$on('emailVerified', function(event, status) {
    $scope.reward.status = status;
    $scope.updateRewards();
  });
});
