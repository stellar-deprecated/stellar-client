'use strict';

var sc = angular.module('stellarClient');

sc.directive('rewardPane', function () {
  return {
    restrict: 'E',
    replace: true,
    transclude: false,
    scope: {},
    templateUrl: '/templates/reward-pane.html',

    controller: function ($scope, session, bruteRequest, API_LOCATION) {
      $scope.showRewards = false;

      var rewardStatusTypes = ['pending', 'complete'];

      $scope.rewardStatusIcons = {
        'incomplete': 'glyphicon glyphicon-lock',
        'pending': 'glyphicon glyphicon-time',
        'complete': 'glyphicon glyphicon-ok-circle'
      };

      $scope.rewards = [
        {message: 'Verify your identity by connecting with Facebook', status: 'incomplete'},
        {message: 'Enable account recovery by verifying your email address', status: 'incomplete'},
        {message: 'Send stellars to someone', status: 'incomplete'},
        {message: 'Create a new wallet', status: 'complete'}
      ];

      var rewardsRequest = new bruteRequest({
          url: API_LOCATION + '/user/rewards',
          type: 'GET',
          dataType: 'json'
      });

      // Load the status of the user's rewards.
      rewardsRequest.send(
        {
          username: session.get('username'),
          updateToken: session.get('blob').get('updateToken')
        },
        //Success
        function(rewardsGiven){
          var rewardsComplete = 0;

          // Update the status of the user's rewards.
          rewardsGiven.forEach(function(reward){
            // Rewards are 1-based indexed in the server.
            $scope.rewards[reward.rewardID - 1].status = rewardStatusTypes[reward.status];
            if(reward.status === 1) rewardsComplete++;
          });

          // Only show the rewards pane if there are rewards left to complete.
          if(rewardsComplete != 3) $scope.showRewards = true;
        }
      );
    }
  };
});