'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($rootScope, $scope, $http, session) {
  $scope.reward = {
    rewardType: 1,
    status: 'incomplete',
    innerTitle: 'Receive stellars',
    getCopy: function() {
      switch ($scope.rewards.status) {
        case 'sent':
          return {
            title: 'You connected your Facebook!',
            subtitle: getInviteSubtitle()
          };
        case 'reward_error':
        case 'reward_queued':
          return {
            title: "You connected your Facebook!",
            subtitle: "You are on the waiting list! You will get your stellars soon."
          };
        case 'sending':
          return {
            title: "You connected your Facebook!",
            subtitle: "...you should be receiving your reward shortly!"
          };
        case 'ineligible':
          return {
            title: "Your Facebook account is not eligible.",
            subtitle: "Please check back for other ways to participate soon."
          };
        case 'fake':
          // TODO: their account is fake
        case 'incomplete':
          /* falls through */
        default:
          return {
            title: 'Receive stellars on us!',
            subtitle: getInviteSubtitle()
          };
      }
    },
    error: null,
    updateReward: function (status) {
      $scope.reward.status = status;
      switch (status) {
        case 'unverified':
          $scope.reward.error = {};
          $scope.reward.error.template = "templates/facebook-verify-error.html";
          $scope.reward.error.panel = "Almost there! Verify your Facebook account.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'ineligible':
          $scope.reward.error = {};
          $scope.reward.error.info = "Our spam detection checks say your Facebook account isn't eligible. If you are a legitimate user, we apologize and are improving our detection algorithms. And we will release new ways to grab stellars soon, so please check back.";
          $scope.reward.error.panel = "Sorry, your Facebook account isn't eligible.";
          $scope.reward.error.action = null;
          break;
        case 'already_taken':
          $scope.reward.error = {};
          $scope.reward.error.info = "This Facebook account is already in use.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'fake':
          // TODO: their account is fake
          /* falls through */
        default:
          break;
      }
    }
  };
  // add this reward to the parent scope's reward array
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;
  $scope.reward.template = 'templates/facebook-button.html';

  var getInviteSubtitle = function() {
    if ($scope.data) {
      if ($scope.data.inviteCode && !$scope.data.hasClaimedInviteCode) {
        return "Enter your invite code now to receive stellars!";
      } else if ($scope.data.inviteCode && $scope.data.hasClaimedInviteCode) {
        return "Thanks to " + $scope.data.inviterUsername + " you will receive stellars once you connect to Facebook.";
      }
    }

    return 'Log in with Facebook';
  };

  $scope.facebookLogin = function () {
    $scope.loading = true;
    fbLoginStart($http, claim, facebookLoginError);
  };

  function facebookLoginSuccess(status) {
    $scope.rewards[1].status = status;
    $scope.updateRewards();
  }

  /**
 * Send the facebook auth data to the server to be verified and saved.
 *
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.updateToken
 * @param {string} data.fbID
 * @param {string} data.fbAccessToken
 * @param {function} success callback
 * @param {function} error callback
 */
function claim(data) {
  _.extend(data, {
    username: session.get('username'),
    updateToken: session.get('wallet').keychainData.updateToken
  });

  $http.post(Options.API_SERVER + "/claim/facebook", data)
    .success(
      function (response) {
        console.log(response.status);
        facebookLoginSuccess(response.message);
      })
    .error(function (response) {
      facebookLoginError(response);
    });
  }

  function facebookLoginError(response) {
    $scope.loading = false;
    if (response && response.status === 'fail') {
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
          /* falls through */
        default:
        // TODO: generic error
      }
    } else if (response && response.status === 'error') {
      // TODO: generic error
    } else {
      $scope.reward.status = 'incomplete';
    }
  }

  // if
  if (typeof FB !== 'undefined') {
    $rootScope.fbinit = true;
  }
});
