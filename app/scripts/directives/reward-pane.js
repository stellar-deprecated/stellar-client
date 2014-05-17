'use strict';

var sc = angular.module('stellarClient');

sc.directive('rewardPane', function (session, ngTableParams, $filter) {
  return {
    restrict: 'E',
    replace: true,
    transclude: false,
    scope: {},
    templateUrl: '/templates/reward-pane.html',
    controller: function ($scope, $element) {
      $scope.incompleteRewards = [];
      $scope.completeRewards = [];

      // TODO: Load the reward types from the RewardTypes table.
      var rewardTypes = [
        {title: 'facebook', message: 'Verify your identity by connecting with Facebook'},
        {title: 'email', message: 'Enable account recovery by verifying your email address'},
        {title: 'send', message: 'Send stellars to someone'},
        {title: 'wallet', message: 'Create a new wallet'}
      ];

      // TODO: Load the user's completed rewards from the RewardsGiven table.
      var rewardsGiven = ['wallet'];

      rewardTypes.forEach(function(reward){
        if(rewardsGiven.indexOf(reward.title) == -1) $scope.incompleteRewards.push(reward);
        else $scope.completeRewards.push(reward);
      })
    }
  };
});