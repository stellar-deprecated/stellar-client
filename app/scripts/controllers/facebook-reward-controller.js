'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($rootScope, $scope, $http, session, gettextCatalog) {
  $scope.reward = {
    rewardType: 1,
    title: gettextCatalog.getString('Receive stellars on us!'),
    getSubtitle: function () {
      if (!$scope.data) {
        return;
      }
      if ($scope.data.inviteCode && !$scope.data.hasClaimedInviteCode) {
        return gettextCatalog.getString("Enter your invite code now to receive stellars!");
      } else if ($scope.data.inviteCode && $scope.data.hasClaimedInviteCode) {
        return gettextCatalog.getString("Thanks to {{username}} you will receive stellars once you connect to Facebook.")
          .replace('{{username}}', $scope.data.inviterUsername);
      } else {
        return gettextCatalog.getString('Log in with Facebook')
      }
    },
    innerTitle: gettextCatalog.getString('Receive stellars'),
    status: 'incomplete',
    error: null,
    updateReward: function (status) {
      $scope.reward.status = status;
      switch (status) {
        case 'sent':
          $scope.reward.title = gettextCatalog.getString('You connected your Facebook!');
          $scope.reward.subtitle = null;
          break;
        case 'reward_error':
        case 'reward_queued':
          $scope.reward.title = gettextCatalog.getString("You connected your Facebook!");
          $scope.reward.subtitle = gettextCatalog.getString("You are on the waiting list! You will get your stellars soon.");
          break;
        case 'sending':
          $scope.reward.title = gettextCatalog.getString("You connected your Facebook!");
          $scope.reward.subtitle = gettextCatalog.getString("...you should be receiving your reward shortly!");
          break;
        case 'unverified':
          $scope.reward.error = {};
          $scope.reward.error.template = "templates/facebook-verify-error.html";
          $scope.reward.error.panel = gettextCatalog.getString("Almost there! Verify your Facebook account.");
          $scope.reward.error.action = function () {
            $scope.reward.error = null,
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'ineligible':
          $scope.reward.error = {};
          $scope.reward.title = gettextCatalog.getString("Your Facebook account is not eligible.");
          $scope.reward.subtitle = gettextCatalog.getString("Please check back for other ways to participate soon.");
          $scope.reward.error.info = gettextCatalog.getString("Our spam detection checks say your Facebook account isn't eligible. If you are a legitimate user, we apologize and are improving our detection algorithms. And we will release new ways to grab stellars soon, so please check back.");
          $scope.reward.error.panel = gettextCatalog.getString("Sorry, your Facebook account isn't eligible.")
          $scope.reward.error.action = null;
          break;
        case 'already_taken':
          $scope.reward.error = {};
          $scope.reward.error.info = gettextCatalog.getString("This Facebook account is already in use.");
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
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
  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  $scope.reward.template = 'templates/facebook-button.html';

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

  // if
  if (typeof FB !== 'undefined') {
    $rootScope.fbinit = true;
  }
});
