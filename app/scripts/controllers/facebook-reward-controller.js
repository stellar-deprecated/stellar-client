'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($rootScope, $scope, $http, session, $translate) {
  $scope.reward = {
    rewardType: 1,
    title: null, // Waiting for translations to load
    subtitle: null,
    innerTitle: null,
    status: 'incomplete',
    error: null,
    updateReward: function (status) {
      $scope.reward.status = status;
      switch (status) {
        case 'sent':
          $scope.reward.title = $translate.instant('rewards.you_connected_facebook');
          $scope.reward.subtitle = null;
          break;
        case 'reward_error':
        case 'reward_queued':
          $scope.reward.title = $translate.instant('rewards.you_connected_facebook');
          getPlaceInLine();
          break;
        case 'sending':
          $scope.reward.title = $translate.instant('rewards.you_connected_facebook');
          $scope.reward.subtitle = $translate.instant('rewards.you_should_be_receiving_reward_shortly');
          break;
        case 'unverified':
          $scope.reward.error = {};
          $scope.reward.error.template = "templates/facebook-verify-error.html";
          $scope.reward.error.panel = $translate.instant('rewards.verify_facebook');
          $scope.reward.error.action = function () {
            $scope.reward.error = null
          };
          break;
        case 'ineligible':
          $scope.reward.error = {};
          $scope.reward.title = $translate.instant('rewards.your_facebook_not_eligible');
          $scope.reward.subtitle = $translate.instant('rewards.check_other_ways_to_participate');
          $scope.reward.error.info = $translate.instant('rewards.spam_detection_facebook');
          $scope.reward.error.panel = $translate.instant('rewards.sorry_your_facebook_not_eligible');
          $scope.reward.error.action = null;
          break;
        case 'already_taken':
          $scope.reward.error = {};
          $scope.reward.error.info = $translate.instant('rewards.facebook_account_already_in_use');
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
  $translate(['rewards.receiver_first_stellars', 'rewards.login_with_facebook'])
    .then(function(translations) {
      $scope.reward.title = translations['rewards.receiver_first_stellars'];
      $scope.reward.subtitle = translations['rewards.login_with_facebook'];
      $scope.reward.innerTitle = translations['rewards.receiver_first_stellars'];
    });
  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

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
        case 'already_taken':
          $scope.reward.updateReward('already_taken');
          break;
        case 'unverified':
          $scope.reward.updateReward('unverified');
          break;
        case 'ineligible':
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

            $scope.reward.subtitle = $translate.instant('rewards.you_are_on_the_waiting_list');
        /* if (result.message > 1) {
          $scope.reward.subtitle = "You are on the waiting list! Approximate waiting time: " + result.message + " days.";
        } else {
          $scope.reward.subtitle = "You are on the waiting list! You will get your stellars tomorrow.";
        } */
      });
  }

  // if
  if (typeof FB !== 'undefined') {
    $rootScope.fbinit = true;
  }
});
