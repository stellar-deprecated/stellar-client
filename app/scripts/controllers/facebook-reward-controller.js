'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($scope, $http, session) {
  $scope.reward = {
    rewardType: 1,
    title: 'Receive your first stellars on us!',
    subtitle: 'Log in with Facebook',
    innerTitle: 'Receive your first stellars.',
    status: 'incomplete',
    error: null,
    updateReward: function (status) {
      $scope.reward.status = status;
      switch (status) {
        case 'sent':
          $scope.reward.title = 'You connected your Facebook!';
          $scope.reward.subtitle = null;
          break;
        case 'reward_queued':
          $scope.reward.title = "You connected your Facebook!";
          getPlaceInLine();
          break;
        case 'sending':
          $scope.reward.title = "You connected your Facebook!";
          $scope.reward.subtitle = "...you should be receiving your reward shortly!";
          break;
        case 'unverified':
          $scope.reward.error = {};
          $scope.reward.error.info = "Please verify your Facebook account and try again.";
          $scope.reward.error.panel = "Almost there! Verify your Facebook account.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null
          };
          break;
        case 'ineligible':
          $scope.reward.error = {};
          $scope.reward.title = "Your Facebook account is not eligible.";
          $scope.reward.subtitle = "Please check back for other ways to participate soon.";
          $scope.reward.error.info = "Your Facebook account is too new to qualify. Stay tuned for new ways to grab stellars.";
          $scope.reward.error.panel = "Sorry, your Facebook account is too new."
          $scope.reward.error.action = null;
          break;
        case 'already_taken':
          $scope.reward.error = {};
          $scope.reward.error.info = "This Facebook account is already in use.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null
          };
          break;
        case 'fake':
          // TODO: their account is fake
        default:
          break;
      }
    }
  };
  // add this reward to the parent scope's reward array
  $scope.rewards.push($scope.reward);

  $scope.reward.template = 'templates/facebook-button.html';

  $scope.facebookLogin = function () {
    var username = session.get('username');
    var updateToken = session.get('wallet').keychainData.updateToken;
    $scope.loading = true;
    fbLoginStart($http, username, updateToken, facebookLoginSuccess, facebookLoginError);
  };

  function facebookLoginSuccess(status) {
    $scope.rewards[1].status = status;
    $scope.updateRewards();
  }

  function facebookLoginError(response) {
    $scope.loading = false;
    if (response && response.status == 'fail') {
      switch (response.code) {
        case 'validation_error':
          var errorJSON = response.data;
          if (errorJSON.field == "update_token" && errorJSON.code == "invalid") {
            // TODO: log user out
          } else if (errorJSON.field == "facebook_id" && errorJSON.code == "already_taken") {
            $scope.reward.updateReward('already_taken');
          }
          break;
        case 'unverified':
          $scope.reward.updateReward('unverified');
          break;
        case 'ineligible_account':
          $scope.reward.updateReward('ineligible');
          break;
        case 'fake_account':
          $scope.reward.updateReward('fake');
          break;
        case 'reward_already_queued':
        case 'reward_limit_reached':
        default:
        // TODO: generic error
      }
    } else if (response && response.status == 'error') {
      // TODO: generic error
    } else {
      $scope.reward.status = 'incomplete';
    }
  }

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
          $scope.reward.subtitle = "You are on the waiting list! Approximate waiting time: " + result.message + " days.";
        } else {
          $scope.reward.subtitle = "You are on the waiting list! You will get your stellars tomorrow.";
        }
      });
  }
});
