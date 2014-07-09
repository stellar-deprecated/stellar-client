'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', function ($http, $scope, $rootScope, $q, session, stNetwork) {
  $scope.showRewards = false;
  $scope.showRewardsComplete = null;
  $scope.selectedReward = null;
  $scope.giveawayAmount=0;

  $scope.rewardStatusIcons = {
    'incomplete': 'glyphicon glyphicon-lock',
    'awaiting_payout': 'glyphicon glyphicon-time',
    'sent': 'glyphicon glyphicon-ok-circle',
    'unverified': 'glyphicon glyphicon-lock',
    'ineligible': 'glyphicon glyphicon-warning-sign'
  };

  $scope.rewards = [
    {index: 0, title: 'Create a new wallet', innerTitle: 'Create a new wallet', status: 'sent'},
    {index: 1, title: 'Receive your first stellars on us! Log in with Facebook', innerTitle: 'Receive your first stellars.', status: 'incomplete'},
    {index: 2, title: 'Set up password recovery', innerTitle: 'Set up password recovery', status: 'incomplete'},
    {index: 3, title: 'Send stellars to a friend', innerTitle: 'Send stellars to a friend', status: 'incomplete'}
  ];

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

  $scope.rewardError = function(reward, error) {
    console.log("error: " + error);
    var info, panel, action;
    switch (error) {
      case 'unverified':
        info = "Please verify your Facebook account and try again.";
        panel = "Almost there! Verify your Facebook account.";
        action = function () {
          reward.error = null
        };
        break;
      case 'ineligible':
        info = "Your Facebook account is too new to qualify. Stay tuned for new ways to grab stellars.";
        panel = "Sorry, your Facebook account is too new."
        action = null;
        break;
      case 'already_taken':
        info = "This Facebook account is already in use.";
        action = function () {
          reward.error = null
        };
    }
    reward.error = {
      panel: panel,
      body: "Oops!",
      info: info,
      action: action
    }
  };

  function getPlaceInLine() {
    // Load the status of the user's rewards.
    var config = {
      params:
        {
          username: session.get('username')
        }
    };

    $http.get(Options.API_SERVER + '/claim/placeInLine', config)
      .success(function (result) {
        if (result.message > 1) {
          $scope.rewards[1].title = "You are on the waiting list! Approximate waiting time: " + result.message + " days.";
        } else {
          $scope.rewards[1].title = "You are on the waiting list! You will get your stellars tomorrow.";
        }
      });
  }

  $scope.computeRewardProgress = function() {
    var order = {
      'incomplete': 0,
      'awaiting_payout': 1,
      'unverified': 1,
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
          $scope.rewards[reward.rewardType].status = reward.status;
        });

        $scope.giveawayAmount = response.data.giveawayAmount;

        $scope.computeRewardProgress();
      });
  };

  // checks if the user has any "sent" transactions, requests send reward if so
  function checkSentTransactions() {
    var promise = $q.defer();
    if ($scope.rewards[3].status != "incomplete") {
      return promise.resolve();
    }

    var sendRewardRequested = false;

    var remote = stNetwork.remote;
    var account = $rootScope.account;
    var params = {
      'account': account,
      'ledger_index_min': 0,
      'ledger_index_max': 9999999,
      'descending': true,
      'count': true
    };

    // Transactions
    remote.request_account_tx(params)
      .on('success', function (data) {
        data.transactions = data.transactions || [];

        $scope.$apply(function () {
          for(var i = 0; i < data.transactions.length; i++){
            var processedTxn = JsonRewriter.processTxn(data.transactions[i].tx, data.transactions[i].meta, account);
            var transaction = processedTxn.transaction;

            if (transaction && transaction.type == "sent") {
              requestSentStellarsReward();
              sendRewardRequested = true;
              break;
            }
          }

          if (!sendRewardRequested) {
            setupSendTxListener();
          }

          promise.resolve();
        });
      })
      .on('error', function () {
        promise.reject();
      })
      .request();

    return promise;
  }

  var sendTxListener;
  function setupSendTxListener(){
    if (sendTxListener) {
      sendTxListener();
    }

    sendTxListener = $scope.$on('$appTxNotification', function (event, tx) {
      if (tx.type == 'sent' && $scope.rewards[3].status == "incomplete") {
        requestSentStellarsReward();
        sendTxListener();
      }
    });
  }

  function requestSentStellarsReward() {
    var data = {username: session.get('username')};

    return $http.post(Options.API_SERVER + "/claim/sendStellars", data)
      .success(function (response) {
        $scope.rewards[3].status = response.message;
        $scope.updateRewards();
      });
  }

  $scope.updateRewards()
    .then(checkSentTransactions)
    .then(function(){
      // Don't show the reward complete message if completed on the first load.
      $scope.showRewardsComplete = false;
    });
});
