'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', ['$http', '$scope', '$rootScope', 'session', 'stNetwork', function ($http, $scope, $rootScope, session, stNetwork) {
  $scope.showRewards = false;
  $scope.showRewardsComplete = null;
  $scope.selectedReward = null;
    $scope.fbGiveawayAmount=0;

  $scope.rewardStatusIcons = {
    'incomplete': 'glyphicon glyphicon-lock',
    'awaiting_payout': 'glyphicon glyphicon-time',
    'sent': 'glyphicon glyphicon-ok-circle',
    'unverified': 'glyphicon glyphicon-lock',
    'ineligible': 'glyphicon glyphicon-warning-sign'
  };

  $scope.rewards = [
    {index: 0, title: 'Create a new wallet', status: 'sent', action: {}},
    {index: 1, title: 'Receive your first stellars on us! Log in with Facebook', innerTitle: 'Receive your first stellars.', status: 'incomplete', action: {}},
    {index: 2, title: 'Set up password recovery.', status: 'incomplete', action: {}},
    {index: 3, title: 'Send stellars to a friend.', status: 'incomplete', action: {}}
  ];

  $scope.sortedRewards = $scope.rewards.slice();

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

  function updateRewards(success) {
    success = success || function(){};

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
      $scope.fbGiveawayAmount = response.data.giveawayAmount;
            //console.log($scope.data.fbGiveawayAmount);


      $scope.showRewards = (count < 3);
      if ($scope.rewards[3].status == "incomplete") {
        checkSentTransactions(success);
      } else {
        success();
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
  function checkSentTransactions(success) {
    success = success || function(){};

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

          success();
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

  updateRewards(function(){
    $scope.computeRewardProgress();

    // Don't show the reward complete message if completed on the first load.
    $scope.showRewardsComplete = false;
  });
}]);
