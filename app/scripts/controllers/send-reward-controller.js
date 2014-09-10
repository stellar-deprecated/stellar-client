'use strict';

var sc = angular.module('stellarClient');

sc.controller('SendRewardCtrl', function ($rootScope, $scope, $http, StellarNetwork, session, TutorialHelper) {
  $scope.reward = {
    rewardType: 3,
    status: 'incomplete',
    innerTitle: 'Learn to send stellars',
    getCopy: function() {
      switch ($scope.reward.status) {
        case 'needs_fbauth':
        case 'sending':
        case 'sent':
          // User needs to fb auth before they can get their stellars (when they're done, still show this message)
          return {
            title: 'Sent!',
            subtitle: 'Log in with Facebook to receive stellars'
          };
        default:
          return {
            title: 'Send stellars!',
            subtitle: 'Learn to send'
          };
      }
    },
    updateReward: function (status) {
      $scope.reward.status = status;
      if (status === 'sent') {
        removeSentTxListener();
      }
    }
  };
  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  $scope.reward.template = 'templates/send-stellar.html';

  $scope.sendTutorial = function() {
    TutorialHelper.set('dashboard', 'send-tutorial');

    // Scroll up and open the send tab.
    $('html, body').animate({scrollTop: $('.dash-send-container').offset().top}, 400);
    $rootScope.openSend();
  };

  function validateTransaction(tx){
    // TODO: Make this a variable and use it in the template.
    var minAmount = 25 * 1000000;
    return tx && tx.type === "sent" && tx.amount.to_number() >= minAmount;
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
      turnOffTxListener = null;
    }
  }

  // checks if the user has any "sent" transactions, requests send reward if so
  function checkSentTransactions() {
    var sendRewardRequested = false;

    var remote = StellarNetwork.remote;
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
    if ($scope.reward.status === 'incomplete') {
      checkSentTransactions();
      turnOffListener();
    }
  });
});
