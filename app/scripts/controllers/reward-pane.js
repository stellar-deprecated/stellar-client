'use strict';

var sc = angular.module('stellarClient');

sc.controller('RewardPaneCtrl', ['$scope','session','bruteRequest',  function ( $scope, session, bruteRequest) {
      $scope.showRewards = false;

        function fbAuth()
        {
            console.log("fbAuth");
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    $scope.FBID = response.authResponse.userID;
                    $scope.FBAccessToken = response.authResponse.accessToken;
                    claim();
                }else FB.login(handleFBSessionResponse, {scope: 'read_stream'});
            });
        }

        // handle a session response from any of the auth related calls
        function handleFBSessionResponse() {

            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    // the user is logged in and has authenticated your
                    // app, and response.authResponse supplies
                    // the user's ID, a valid access token, a signed
                    // request, and the time the access token
                    // and signed request each expire
                    $scope.FBID = response.authResponse.userID;
                    $scope.FBAccessToken = response.authResponse.accessToken;
                    claim();

                } else if (response.status === 'not_authorized') {
                    // the user is logged in to Facebook,
                    // but has not authenticated your app
                } else {
                    // the user isn't logged in to Facebook.
                }
            });

        }

        function claim()
        {
            $.post(Options.API_SERVER +"/claim/claim", {  username: session.get('username'),
                                updateToken: session.get('blob').get('updateToken'),
                                fbAccessToken: $scope.FBAccessToken,
                                fbID: $scope.FBID },
                    null, "json").done(function (response) {
                $scope.$apply(function () {
                console.log(response.status);
                // error, nameTaken, alreadyClaimed, newFB, queued, success
                switch(response.status)
                {
                    case 'alreadyClaimed':
                        $scope.rewards[0].status="complete";
                        break;
                    case 'newFB':  // user is too new to FB
                        //console.log("New to FB"); // TODO
                        break;
                    case 'queued':
                        break;
                    case 'success':
                        $scope.rewards[0].status="complete";
                        break;
                    case 'error':
                    default:
                        break;
                }
            });
            });
        }

        function verifyEmail()
        {

        }

        function sendStellars()
        {

        }

        function getPlaceInLine()
        {
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
                function(result) {
                    $scope.$apply(function () {
                        if (result.days > 1)
                            $scope.rewards[0].message = "You are on the waiting list. You will get your stellars in about " + result.days + " days.";
                        else $scope.rewards[0].message = "You are on the waiting list. You should get your stellars tomorrow.";

                        $scope.rewards[0].action = function () {
                        };
                    });
                }
            );
        }

      var rewardStatusTypes = ['pending', 'complete' ];

      $scope.rewardStatusIcons = {
        'incomplete': 'glyphicon glyphicon-lock',
        'pending': 'glyphicon glyphicon-time',
        'complete': 'glyphicon glyphicon-ok-circle'
      };

      $scope.rewards = [
        {message: 'Verify your identity by connecting with Facebook', status: 'incomplete', action: fbAuth},
        {message: 'Enable account recovery by verifying your email address', status: 'incomplete', action: verifyEmail},
        {message: 'Send stellars to someone', status: 'incomplete', action: sendStellars},
        {message: 'Create a new wallet', status: 'complete', action: function(){ } }
      ];



      var rewardsRequest = new bruteRequest({
          url: Options.API_SERVER + '/claim/rewards',
          type: 'GET',
          dataType: 'json'
      });

      // Load the status of the user's rewards.
      rewardsRequest.send(
        {
          username: session.get('username'),
          updateToken: session.get('blob').get('updateToken')
        },
        //Success
        function(rewardsGiven){
            // Only show the rewards pane if there are rewards left to complete.
            //$scope.showRewards = true;
            var count=0;
              // Update the status of the user's rewards.
              rewardsGiven.forEach(function(reward){
                // Rewards are 1-based indexed in the server.
                $scope.rewards[reward.rewardID - 1].status = rewardStatusTypes[reward.status];
                if(reward.status == 1) count++;
                if(reward.status == 0 && reward.rewardID==1) // this guy is on the waiting list
                    getPlaceInLine();
              });
            $scope.showRewards=(count<3);
        }
      );
}]);