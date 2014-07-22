'use strict';

var sc = angular.module('stellarClient');

sc.controller('SendRewardCtrl', function ($rootScope, $scope, $http, stNetwork, session, TutorialHelper) {
  $scope.reward = {
    rewardType: 3,
    title: 'Send stellars to a friend!',
    subtitle: 'Learn to send',
    innerTitle: 'Send stellars to a friend',
    status: 'incomplete',
    updateReward: function (status) {
      $scope.reward.status = status;
      if (status == 'sent') {
      	removeSentTxListener();
      }
    }
  }
  // add this reward to the parent scope's reward array
  $scope.rewards.push($scope.reward);

  $scope.reward.template = 'templates/send-stellar.html';

  $scope.sendTutorial = function() {
    TutorialHelper.set('dashboard', 'send-tutorial');

    // Scroll up to ensure the send button is visible.
    $('html, body').animate({scrollTop: 0}, 400);
  };

  function validateTransaction(tx){
    var minAmount = $scope.giveawayAmount * .2 * 1000000;
    return tx && tx.type == "sent" && tx.amount.to_number() >= minAmount;
  }

  var turnOffTxListener;
  function setupSentTxListener() {
  	turnOffTxListener = $scope.$on('$appTxNotification', function (event, tx) {
      if (validateTransaction(tx)) {
        requestSentStellarsReward();
      }
    });
  }

  function removeSentTxListener() {
  	if (turnOffTxListener) {
  		turnOffTxListener();
  	}
  }

  // checks if the user has any "sent" transactions, requests send reward if so
  function checkSentTransactions() {
    var sendRewardRequested = false;

    var remote = stNetwork.remote;
    var account = session.get('address');
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
          var sendRewardRequested = false;
          for(var i = 0; i < data.transactions.length; i++){
            var processedTxn = JsonRewriter.processTxn(data.transactions[i].tx, data.transactions[i].meta, account);
            var transaction = processedTxn.transaction;

            if (validateTransaction(transaction)) {
              requestSentStellarsReward();
              sendRewardRequested = true;
              break;
            }
          }

          if (!sendRewardRequested) {
            setupSentTxListener();
          }
        });
      })
      .on('error', function () {
      })
      .request();
  }

  function requestSentStellarsReward() {
    var data = {username: session.get('username')};

    return $http.post(Options.API_SERVER + "/claim/sendStellars", data)
      .success(function (response) {
        $scope.reward.status = response.message;
      });
  }

  var turnOffListener = $scope.$on("onRewardsUpdated", function () {
    if ($scope.reward.status == 'incomplete') {
      checkSentTransactions();
      turnOffListener();
    }
  });
});
