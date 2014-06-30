'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', ['$http', '$scope', '$rootScope', 'session', 'stNetwork', function ($http, $scope, $rootScope, session, stNetwork) {
  $scope.showRewards = false;
  $scope.selectedReward = null;

  $scope.rewardStatusIcons = {
    'incomplete': 'glyphicon glyphicon-lock',
    'awaiting_payout': 'glyphicon glyphicon-time',
    'sent': 'glyphicon glyphicon-ok-circle',
    'unverified': 'glyphicon glyphicon-warning-sign',
    'ineligible': 'glyphicon glyphicon-warning-sign'
  };

  $scope.rewards = [
    {title: 'Create a new wallet', status: 'sent', action: {}},
    {title: 'Get your first stellars.', status: 'incomplete', action: {}},
    {title: 'Confirm your email.', status: 'incomplete', action: {}},
    {title: 'Learn to send stellars.', status: 'incomplete', action: {}}
  ];

  $scope.toggleReward = function (index, status) {
    if (status !== 'incomplete' && status !== 'unverified') {
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
        info = "Your Facebook acount is too new to qualify. Stay tuned for new ways to grab stellars.";
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
      body: "Ooops!",
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

      $scope.rewards[1].action = function () {
      };
    })
    .error(function (response) {
        // TODO: error
    });
  }

  $scope.computeRewardProgress = function() {
    var order = ['sent', 'awaiting_payout', 'incomplete', 'unverified', 'ineligible'];

    $scope.rewardProgress = $scope.rewards.map(function (reward) {
      return reward.status;
    });

    var completedRewards = $scope.rewards.filter(function (reward) {
      return reward.status == 'sent';
    });
    $scope.showRewards = (completedRewards.length !== $scope.rewards.length);
  };

  function updateRewards() {
    var config = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    };
    // Load the status of the user's rewards.
    $http.get(Options.API_SERVER + '/user/rewards', config)
    .success(function (response) {
      // Only show the rewards pane if there are rewards left to complete.
      var count = 0;

      // Update the status of the user's rewards.
      var rewardsGiven = response.data.rewards;
      rewardsGiven.forEach(function (reward) {
        $scope.rewards[reward.rewardType].status = reward.status;
        switch (reward.status) {
            case 'pending':
              $scope.rewards[reward.rewardType].status = 'incomplete';
              break;
            case 'unverified':
              if (reward.rewardType == 1) {
                rewardError($scope.rewards[reward.rewardType], "unverified");
              }
              break;
            case 'ineligible':
              rewardError($scope.rewards[reward.rewardType], "ineligible");
              break;
            case 'awaiting_payout':
                if (reward.rewardType == 1) {
                  // this guy is on the waiting list
                  getPlaceInLine();
                }
                break;
            case 'sent':
                count++;
        }
      });
      $scope.computeRewardProgress();
      $scope.fbGiveawayAmount = response.data.giveawayAmount;
      $scope.rewards[1].action.info = 'You will receive ' + $scope.fbGiveawayAmount + ' stellas.';
      $scope.rewards[2].action.info = 'You will receive ' + $scope.fbGiveawayAmount * .2 + ' stellas.';
      $scope.rewards[3].action.info = 'Send stellars to a friend and get ' + $scope.fbGiveawayAmount * .2 + ' stellars for learning.';
      $scope.showRewards = (count < 3);
      if ($scope.rewards[3].status == "incomplete") {
        checkSentTransactions();
      }
    })
    .error(function (response) {
      if (response && response.status == 'fail') {
        if (response.code == 'validation_error') {
          var error = response.data;
          if (error.field == "update_token" && error.code == "invalid") {
              // TODO: invalid update token error
          }
        }
      } else {
          // TODO: error
      }
    });
  }

  var offFn;
  // checks if the user has any "sent" transactions, requests send reward if so
  function checkSentTransactions() {
    var remote = stNetwork.remote;
    var account = $rootScope.account;
    var requestStellars = true;
    // Transactions
    remote.request_account_tx({
      'account': account,
      'ledger_index_min': 0,
      'ledger_index_max': 9999999,
      'descending': true,
      'count': true
    })
      .on('success', function (data) {
        $scope.$apply(function () {
          if (data.transactions) {
            data.transactions.forEach(function (e) {
              var processedTxn = JsonRewriter.processTxn(e.tx, e.meta, account);
              var transaction = processedTxn.transaction;
              if (transaction && transaction.type == "sent" && $scope.rewards[3].status == "incomplete" && requestStellars) {
                requestSentStellarsReward();
                requestStellars = false;
              }
            });
            if (requestStellars) {
              if (offFn) {
                offFn();
              }
              offFn = $scope.$on('$appTxNotification', function (event, tx) {
                if (tx.type == 'sent' && $scope.rewards[3].status == "incomplete") {
                  requestSentStellarsReward();
                  offFn();
                }
              });
            }
          }
        });
      })
      .on('error', function () {

      })
      .request();
  }

  function requestSentStellarsReward() {
    var username = session.get('username');
    $http.post(Options.API_SERVER + "/claim/sendStellars", {"username": username})
      .success(function (response) {
        console.log(response.status);
        $scope.rewards[3].status = response.message;
        $scope.computeRewardProgress();
      })
      .error(function (response) {

      });
  }

  updateRewards();
  $scope.computeRewardProgress();
}]);
