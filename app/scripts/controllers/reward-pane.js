'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', function ($http, $scope, $rootScope, $q, session, TutorialHelper, singletonPromise, FlashMessages, contacts, invites) {
  $scope.rewardsComplete     = false;
  $scope.showRewardsComplete = null;
  $scope.selectedReward      = null;
  $scope.giveawayAmount      = 0;

  $scope.data = {};
  // populate the invite code if we have one
  $scope.$on('userLoaded', function () {
    // using data.inviteCode because for some reason the input's model is in a child scope
    $scope.data.inviteCode = session.getUser().getInviteCode();
    $scope.data.hasClaimedInviteCode = session.getUser().hasClaimedInviteCode();
    $scope.data.inviterUsername = session.getUser().getInviterUsername();
  });

  $scope.showRewards = function() {
    var wallet = session.get('wallet');
    var showRewardsSetting = wallet.get('mainData', 'showRewards', true);

    return !$scope.rewardsComplete && showRewardsSetting;
  };

  var firstRequest = true;

  $scope.rewardStatusIcons = {
    'incomplete': 'icon icon-lock',
    'pending': 'icon icon-lock',
    'reward_error': 'icon icon-clock',
    'reward_queued': 'icon icon-clock',
    'needs_fbauth': 'icon icon-clock',
    'ready': 'icon icon-clock',
    'sending': 'icon icon-clock',
    'sent': 'icon icon-tick',
    'unverified': 'icon icon-clock',
    'ineligible': 'icon icon-lock' // TODO: Use yield sign icon.
  };

  /**
  * Holds each reward object.
  */
  $scope.rewards = [];

  // HACK: Reward type 4 requires the user to claim, but has no interface.
  $scope.rewards[4] = {
    status: 'sent',
    hidden: true,
    updateReward: function(status) {
      $scope.rewards[4].status = status;
    }
  };

  $scope.$watch($scope.rewards, function (newValue, oldValue, scope) {
    $scope.sortedRewards = $scope.rewards.slice();
  });

  $scope.sortedRewards = $scope.rewards.slice();

  $scope.toggleReward = function (index) {
    if ($scope.rewards[index].status === 'sent') {
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
    TutorialHelper.clear('dashboard');
  };

  $scope.submitInviteCode = function () {
    if (_.isEmpty($scope.data.inviteCode)) {
      $scope.closeReward();
    } else {
      console.log('claiming');
      invites.claim($scope.data.inviteCode)
        .success(function (response) {
          $scope.updateRewards();
        })
        .error(function (response) {
          if (response.status === "fail") {
            Util.showError($('.invite-fb-form [data-toggle=tooltip'), response.message);
          }
        });
    }
  };

  $scope.rewardQueuedButtonTitle = function() {
    return _.isEmpty($scope.data.inviteCode) ? "Continue" : "Submit Invite Code";
  };

  $scope.computeRewardProgress = function() {
    var order = {
      'incomplete': 0,
      'pending': 0,
      'reward_error': 1,
      'reward_queued': 1,
      'needs_fbauth': 1,
      'unverified': 1,
      'ready': 1,
      'sending': 1,
      'sent': 2,
      'ineligible': 2
    };

    $scope.sortedRewards.sort(function (a, b) {
      return order[a.status] - order[b.status];
    });

    var visibleRewards = $scope.rewards.filter(function(reward) {
      return !reward.hidden;
    });

    $scope.rewardProgress = visibleRewards.map(function (reward) {
      return reward.status;
    });

    $scope.rewardProgress.sort(function (a, b) {
      return order[b] - order[a];
    });
    var completedRewards = $scope.rewards.filter(function (reward) {
      return reward.status === 'sent';
    });
    $scope.rewardsComplete = (completedRewards.length === $scope.rewards.length);

    $scope.showRewardsComplete = $scope.rewardsComplete;

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
      var fairyContact = contacts.getContactByEmail('StellarFoundation@stellar.org');
      if (fairyContact && tx.counterparty === fairyContact.destination_address) {
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

  function processReadyRewards() {
    var readyRewards = _.where($scope.rewards, {status: 'ready'});

    if(readyRewards.length > 0) {
      $rootScope.$broadcast('flashMessage', {
        id: 'claimRewards',
        title: 'You have stellars waiting to be claimed!',
        template: 'templates/claim-flash-message.html',
        type: 'success'
      });
    }

    return $q.when();
  }

  $scope.claimRewards = singletonPromise(function() {
    var data = {
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken
    };

    return $http.post(Options.API_SERVER + '/user/claimRewards', data)
      .then(function() {
        $scope.rewards.forEach(function(reward) {
          if(reward.status === 'ready') {
            reward.updateReward('sending');
          }
        });

        FlashMessages.dismissById('claimRewards');
      });
  });

  function getInviteClaimedFlashMessageInfo() {
    var facebookClaimed =
      $scope.rewards[1].status === "sending" ||
      $scope.rewards[1].status === "sent" ||
      $scope.rewards[1].status === 'ready';
    if (facebookClaimed) {
      return "Claim your reward now!";
    } else {
      return "Connect with Facebook to claim your reward!";
    }
  }

  $rootScope.$on('claimRewards', function(callback) {
    $scope.claimRewards()
      .then(callback);
  });

  $scope.$on('openFacebookReward', function () {
    $scope.selectedReward = 1;
  });

  $scope.$on('invite-claimed', function () {
    $scope.updateRewards()
      .then(function () {
        FlashMessages.add({title: "Invite claimed!", info: getInviteClaimedFlashMessageInfo()});
      })
      .then(processReadyRewards);
  });

  $scope.updateRewards()
    .then(setupFairyTxListener)
    .then(processReadyRewards);
});
