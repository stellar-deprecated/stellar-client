'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session) {
  $scope.reward = {
    rewardType: 2,
    status: 'incomplete',
    innerTitle: 'Set up password recovery',
    getCopy: function(type) {
      console.log($scope.reward.status, type);
      switch ($scope.reward.status) {
        case 'unverified':
          // User put in email but hasn't put in recovery code
          var copy = {
            title: 'Set up password recovery!',
            subtitle: 'Enter your recovery code to complete'
          };
          break;
        case 'needs_fbauth':
        case 'sending':
        case 'sent':
          // User needs to fb auth before they can get their stellars (when they're done, still show this message)
          var copy = {
            title: 'Password recovery activated',
            subtitle: 'Log in with Facebook to receive stellars'
          }
          break;
        default:
          var copy = {
            title: 'Set up password recovery!',
            subtitle: 'Verify your email'
          }
          break;
      }

      return copy[type];
    },
    updateReward: function (status) {
      $scope.reward.status = status;
    }
  }

  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  $scope.reward.template = 'templates/verify-email.html';

  $rootScope.$on('emailVerified', function(event, status) {
    $scope.reward.status = status;
    $scope.updateRewards();
  });
});
