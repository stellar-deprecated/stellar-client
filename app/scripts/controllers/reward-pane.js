'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', ['$scope', '$rootScope', 'session', 'bruteRequest', function ($scope, $rootScope, session, bruteRequest) {
  $scope.showRewards = false;
  $scope.selectedReward = null;
  $rootScope.emailToVerify = session.get('blob').get('email');

  $scope.toggleReward = function(index, status) {
    if (status !== 'incomplete') {
      return;
    }

    if ($scope.selectedReward === index) {
      $scope.selectedReward = null;
    } else {
      $scope.selectedReward = index;
    }
  };

  $scope.closeReward = function() {
    $scope.selectedReward = null;
  };

  var fbAction = {
    message: 'Earn a reward by verifying your Stellar account with Facebook.',
    info: 'You will unlock...',
    template: 'templates/facebook-button.html',
    start: function(){
      var username = session.get('username');
      var updateToken = session.get('blob').get('updateToken');
      fbLoginStart(username, updateToken, fbAction.success, fbAction.error);
    },
    success: function(status) {
      $scope.$apply(function(){
        console.log(status);
        $scope.rewards[1].status = status;
        computeRewardProgress();
        updateRewards();
        $scope.closeReward();
      });
    },
    error: function(message){
      // TODO: show error
    }
  };

  var emailAction = {
    message: 'Earn a reward by verifying an email address you can use to recover your account.',
    info: 'You will unlock...',
    template: 'templates/verify-email.html',
    success: function(event, status){
      $scope.rewards[2].status = status;
      computeRewardProgress();
      $scope.closeReward();
    }
  };
  $rootScope.$on('emailVerified', emailAction.success);

  var sendAction = {
    message: 'Learn how to send digital money.',
    info: 'Send 100 stellars to a friend and get 100 stellars for learning.',
    template: 'templates/send-stellar.html',
    start: function() {
      $rootScope.tab = 'send';
      scrollTo(scrollX, 188);
      // TODO: Show send tutorial.
    },
    success: function() {
      $scope.rewards[3].status = "complete";
      computeRewardProgress();
      $scope.closeReward();
    }
  };

  var createAction = {
    message: 'Enable rewards by registering for a Stellar account',
    info: 'You have unlocked rewards...',
    start: function() {}
  };

  function getPlaceInLine() {
    var placeInLineRequest = new bruteRequest({
      url: Options.API_SERVER + '/claim/placeInLine',
      type: 'GET',
      dataType: 'json'
    });
    // Load the status of the user's rewards.
    placeInLineRequest.send(
      {
        username: session.get('username')
      },
      //Success
      function (result) {
        $scope.$apply(function () {
          if (result.days > 1) {
            $scope.rewards[0].message = "You are on the waiting list. You will get your stellars in about " + result.days + " days.";
          } else {
            $scope.rewards[0].message = "You are on the waiting list. You should get your stellars tomorrow.";
          }

          $scope.rewards[0].action = function () {
          };
        });
      },
      function (response) {
        // TODO: error
      }
    );
  }

  $scope.rewardStatusIcons = {
    'incomplete': 'glyphicon glyphicon-lock',
    'awaiting_payout': 'glyphicon glyphicon-time',
    'sent': 'glyphicon glyphicon-ok-circle'
  };

  $scope.rewards = [
    {title: 'Create a new wallet', status: 'sent', action: createAction},
    {title: 'Get you first stellars.', status: 'incomplete', action: fbAction},
    {title: 'Confirm your email.', status: 'incomplete', action: emailAction},
    {title: 'Learn to send stellars.', status: 'incomplete', action: sendAction}
  ];

  function computeRewardProgress() {
    var statuses = $scope.rewards.map(function (reward) { return reward.status; });
    $scope.rewardProgress = statuses.sort(function (a, b) {
      var order = ['sent', 'awaiting_payout', 'incomplete'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  var rewardsRequest = new bruteRequest({
    url: Options.API_SERVER + '/user/rewards',
    type: 'GET',
    dataType: 'json'
  });

    function updateRewards() {
      // Load the status of the user's rewards.
      rewardsRequest.send(
        {
          username: session.get('username'),
          updateToken: session.get('blob').get('updateToken')
        },
        //Success
        function (response) {
            // Only show the rewards pane if there are rewards left to complete.
            var count = 0;

            // Update the status of the user's rewards.
            var rewardsGiven = response.data.rewards;
            rewardsGiven.forEach(function (reward) {
                $scope.rewards[reward.rewardType].status = reward.status;
                switch (reward.status) {
                    case 'awaiting_payout':
                        // this guy is on the waiting list
                        getPlaceInLine();
                        break;
                    case 'sent':
                        count++;
                }
            });
            computeRewardProgress();
            $scope.showRewards = (count < 3);
        },
        function (response) {
            if (response.status == 'fail') {
                if (response.code == 'validaiton_error') {
                    var error = response.data;
                    if (error.field == "update_token" && error.code == "invalid") {
                        // TODO: invalid update token error
                    }
                }
            } else {
                // TODO: error
            }
        }
      );
    }

  computeRewardProgress();
  updateRewards();

}]);