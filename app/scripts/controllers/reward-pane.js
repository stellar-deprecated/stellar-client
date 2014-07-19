'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', function ($http, $scope, $rootScope, $q, session) {
  $scope.showRewards = false;
  $scope.showRewardsComplete = null;
  $scope.selectedReward = null;
  $scope.giveawayAmount=0;

  var firstRequest = true;

  $scope.rewardStatusIcons = {
    'incomplete': 'icon icon-lock',
    'pending': 'icon icon-lock',
    'reward_queued': 'icon icon-clock',
    'needs_fbauth': 'icon icon-clock',
    'sending': 'icon icon-clock',
    'sent': 'icon icon-tick',
    'unverified': 'icon icon-clock',
    'ineligible': 'icon icon-lock' // TODO: Use yeild sign icon.
  };

  /**
  * Holds each reward object.
  */
  $scope.rewards = [];

  $scope.$watch($scope.rewards, function (newValue, oldValue, scope) {
    $scope.sortedRewards = $scope.rewards.slice();
  });

  $scope.sortedRewards = $scope.rewards.slice();

  $scope.toggleReward = function (index) {
    if ($scope.rewards[index].status == 'sent') {
      return;
    }

    if ($scope.selectedReward === index) {
      $scope.selectedReward = null;
    } else {
      $scope.selectedReward = index;
      $scope.rewards[index].error = null;
    }
  };

  $scope.closeReward = function () {
    $scope.selectedReward = null;
  };

  $scope.computeRewardProgress = function() {
    var order = {
      'incomplete': 0,
      'pending': 0,
      'reward_queued': 1,
      'needs_fbauth': 1,
      'unverified': 1,
      'sending': 1,
      'sent': 2,
      'ineligible': 2
    };

    $scope.sortedRewards.sort(function (a, b) {
      return order[a.status] - order[b.status];
    });

    $scope.rewardProgress = $scope.rewards.map(function (reward) {
      return reward.status;
    });

    $scope.rewardProgress.sort(function (a, b) {
      return order[b] - order[a];
    });
    var completedRewards = $scope.rewards.filter(function (reward) {
      return reward.status == 'sent';
    });
    $scope.showRewards = (completedRewards.length !== $scope.rewards.length);

    $scope.showRewardsComplete = (completedRewards.length == $scope.rewards.length);

    if($scope.showRewardsComplete && !firstRequest) {
      $rootScope.$broadcast('flashMessage', {
        title: 'Oh, happy day!',
        info: 'You unlocked all the rewards.',
        type: 'success'
      });
    }

    firstRequest = false;
  };

  $scope.updateRewards = function() {
    var config = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    };

    // Load the status of the user's rewards.
    return $http.get(Options.API_SERVER + '/user/rewards', config)
      .success(function (response) {
        // Update the status of the user's rewards.
        response.data.rewards.forEach(function (reward) {
          $scope.rewards[reward.rewardType].updateReward(reward.status);
        });

        $scope.giveawayAmount = response.data.giveawayAmount;

        $scope.computeRewardProgress();

        $scope.$broadcast("onRewardsUpdated");
      });
  };

  var turnOffTxListener;
  function setupFairyTxListener() {
    turnOffTxListener = $scope.$on('$appTxNotification', function (event, tx) {
      if (tx.counterparty == session.get('wallet').mainData.stellar_contact.destination_address) {
        $scope.updateRewards();
      }
    });
  }

  function hasCompletedRewards() {
    for (var i = 0; i < $scope.rewards; i++) {
      if ($scope.rewards[i].status != 'sent') {
        return false;
      }
    }
    return true;
  }

  $scope.updateRewards().then(setupFairyTxListener);
});
