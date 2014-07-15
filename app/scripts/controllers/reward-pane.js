'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', function ($http, $scope, $rootScope, $q, session, stNetwork) {
  $scope.showRewards = false;
  $scope.showRewardsComplete = null;
  $scope.selectedReward = null;
  $scope.giveawayAmount=0;

  $scope.rewardStatusIcons = {
    'incomplete': 'icon icon-lock',
    'reward_queued': 'icon icon-lock', // TODO: Use clock icon.
    'needs_fbauth': 'icon icon-lock', // TODO: Use clock icon.
    'sending': 'icon icon-lock', // TODO: Use clock icon.
    'sent': 'icon icon-tick',
    'unverified': 'icon icon-lock', // TODO: Use clock icon.
    'ineligible': 'icon icon-lock' // TODO: Use yeild sign icon.
  };

  var walletReward = {
    rewardType: 0,
    title: 'Create a new wallet',
    innerTitle: 'Create a new wallet',
    status: 'sent'
  }

  /**
  * Holds each reward object.
  */
  $scope.rewards = [
    walletReward
  ]

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

        if (hasCompletedRewards()) {
          removeFairyTxListener();
        }

        $scope.$broadcast("onRewardsUpdated");
      });
  };

  var turnOffFairyTxListener;
  function setupFairyTxListener() {
    var promise = $q.defer();
    if (hasCompletedRewards()) {
      return promise.resolve();
    }

    turnOffFairyTxListener = $scope.$on('$appTxNotification', function (event, tx) {
      if (tx.counterparty == session.get('wallet').mainData.stellar_contact.destination_address) {
        $scope.updateRewards();
      }
    });
  }

  function removeFairyTxListener() {
    if (turnOffFairyTxListener) {
      turnOffFairyTxListener();
    }
  }

  function hasCompletedRewards() {
    return $scope.showRewardsComplete;
  }

  $scope.updateRewards()
    .then(setupFairyTxListener)
    .then(function(){
      // Don't show the reward complete message if completed on the first load.
      $scope.showRewardsComplete = false;
    });
});
