'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', ['$http', '$scope', '$rootScope', 'session', 'stNetwork', function ($http, $scope, $rootScope, session, stNetwork) {
  $scope.showRewards = false;
  $scope.selectedReward = null;

  var wallet = session.get('wallet');

  $rootScope.emailToVerify = wallet.mainData.email;

  $scope.toggleReward = function (index, status) {
    if (status !== 'incomplete' && status !== 'unverified') {
      return;
    }

    if ($scope.selectedReward === index) {
      $scope.selectedReward = null;
    } else {
      $scope.selectedReward = index;
    }
  };

  $scope.closeReward = function () {
    $scope.selectedReward = null;
  };

  var fbAction = {
    message: 'Earn a reward by verifying your Stellar account with Facebook.',
    template: 'templates/facebook-button.html',
    start: function () {
      var username = session.get('username');
      var updateToken = wallet.keychainData.updateToken;
      $scope.loading = true;
      fbLoginStart(username, updateToken, fbAction.success, fbAction.error);
    },
    success: function (status) {
      $scope.$apply(function () {
        console.log(status);
        $scope.rewards[1].status = status;
        computeRewardProgress();
        updateRewards();
        $scope.closeReward();
      });
    },
    error: function (response) {
      $scope.$apply(function () {
        $scope.loading = false;
        var responseJSON = response.responseJSON;
        if (!responseJSON) {
          // TODO: push generic "an error occurred"
          return;
        }
        if (responseJSON.status == 'fail') {
          switch (responseJSON.code) {
            case 'validation_error':
              var errorJSON = responseJSON.data;
              if (errorJSON.field == "update_token" && errorJSON.code == "invalid") {
                // TODO: error
              } else if (errorJSON.field == "facebook_id" && errorJSON.code == "already_taken") {
                rewardError($scope.rewards[1], 'already_taken');
              }
              break;
            case 'unverified':
              $scope.rewards[1].status = 'unverified';
              rewardError($scope.rewards[1], 'unverified');
              break;
            case 'ineligible_account':
              $scope.rewards[1].status = 'ineligible';
              rewardError($scope.rewards[1], 'ineligible');
              break;
            case 'fake_account':
            // TODO: inform the user their account is fake
            case 'reward_already_queued':
            case 'reward_limit_reached':
            default:
            // TODO: an error occured message
          }
        } else {
          if (responseJSON.code == 'transaction_error') {
            // we've stored the reward but there was an error sending the transaction
            $scope.rewards[1].status = 'awaiting_payout';
            computeRewardProgress();
            updateRewards();
            $scope.closeReward();
          }
        }
      })
    }
  };

  function rewardError(reward, error) {
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
  }

  var emailAction = {
    message: 'Earn a reward by verifying an email address you can use to recover your account.',
    template: 'templates/verify-email.html',
    success: function (event, status) {
      $scope.rewards[2].status = status;
      computeRewardProgress();
      $scope.closeReward();
    }
  };
  $rootScope.$on('emailVerified', emailAction.success);

  var sendAction = {
    message: 'Learn how to send digital money.',
    template: 'templates/send-stellar.html',
    start: function () {
      $rootScope.tab = 'send';
      scrollTo(scrollX, 188);
      // TODO: Show send tutorial.
    },
    success: function () {
      $scope.rewards[3].status = "sent";
      computeRewardProgress();
      $scope.closeReward();
    }
  };

  var createAction = {
    message: 'Enable rewards by registering for a Stellar account',
    info: 'You have unlocked rewards...',
    start: function () {
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

  $scope.rewardStatusIcons = {
    'incomplete': 'glyphicon glyphicon-lock',
    'awaiting_payout': 'glyphicon glyphicon-time',
    'sent': 'glyphicon glyphicon-ok-circle',
    'unverified': 'glyphicon glyphicon-warning-sign',
    'ineligible': 'glyphicon glyphicon-warning-sign'
  };

  $scope.rewards = [
    {title: 'Create a new wallet', status: 'sent', action: createAction},
    {title: 'Get your first stellars.', status: 'incomplete', action: fbAction},
    {title: 'Confirm your email.', status: 'incomplete', action: emailAction},
    {title: 'Learn to send stellars.', status: 'incomplete', action: sendAction}
  ];

  function computeRewardProgress() {
    var statuses = $scope.rewards.map(function (reward) {
      return reward.status;
    });
    $scope.rewardProgress = statuses.sort(function (a, b) {
      var order = ['sent', 'awaiting_payout', 'incomplete', 'unverified', 'ineligible'];
      return order.indexOf(a) - order.indexOf(b);
    });

    var completedRewards = $scope.rewards.filter(function (reward) {
      return reward.status == 'sent';
    });
    $scope.showRewards = (completedRewards.length !== $scope.rewards.length);
  }

  function updateRewards() {
    var config = {
      params: {
        username: session.get('username'),
        updateToken: wallet.keychainData.updateToken
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
      computeRewardProgress();
      $scope.fbGiveawayAmount = response.data.giveawayAmount;
      fbAction.info = 'You will receive ' + $scope.fbGiveawayAmount + ' stellas.';
      emailAction.info = 'You will receive ' + $scope.fbGiveawayAmount * .2 + ' stellas.';
      sendAction.info = 'Send stellars to a friend and get ' + $scope.fbGiveawayAmount * .2 + ' stellars for learning.';
      $scope.showRewards = (count < 3);
      if ($scope.rewards[3].status == "incomplete") {
        checkSentTransactions();
      }
    })
    .error(function (response) {
      var responseJSON = response.responseJSON;
      if (responseJSON && responseJSON.status == 'fail') {
        if (responseJSON.code == 'validation_error') {
          var error = responseJSON.data;
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
              if (transaction.type == "sent" && $scope.rewards[3].status == "incomplete" && requestStellars) {
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
    $.post(Options.API_SERVER + "/claim/sendStellars", {"username": username}, null, "json")
      .success(
      function (response) {
        $scope.$apply(function () {
          console.log(response.status);
          $scope.rewards[3].status = response.message;
          computeRewardProgress();
        });
      })
      .error(
      function (response) {

      });
  }

  updateRewards();
  computeRewardProgress();
}]);
