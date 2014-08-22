'use strict';

var sc = angular.module('stellarClient');

sc.controller('EmailRewardCtrl', function ($scope, $rootScope, session, gettextCatalog) {
  $scope.reward = {
    rewardType: 2,
    title: gettextCatalog.getString('Set up password recovery!'),
    subtitle: gettextCatalog.getString('Verify your email'),
    innerTitle: gettextCatalog.getString('Set up password recovery'),
    status: 'incomplete',
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
