'use strict';

var sc = angular.module('stellarClient');

sc.controller('SendRewardCtrl', function ($rootScope, $scope, $http, stNetwork, session, TutorialHelper, $translate) {
  $scope.reward = {
    rewardType: 3,
    title: null, // Waiting for translations to load
    subtitle: null,
    innerTitle: null,
    status: 'incomplete',
    updateReward: function (status) {
      $scope.reward.status = status;
      if (status == 'sent') {
      	removeSentTxListener();
      }
    }
  };

  $translate(['rewards.send_stellars', 'rewards.learn_to_send'])
    .then(function(translations) {
      $scope.reward.title = translations['rewards.send_stellars'];
      $scope.reward.subtitle = translations['rewards.learn_to_send'];
      $scope.reward.innerTitle = translations['rewards.send_stellars'];
    });

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
    var minAmount = $scope.giveawayAmount * .025 * 1000000;
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
      turnOffTxListener = null;
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
