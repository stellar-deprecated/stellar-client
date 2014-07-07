'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($scope, $http, session) {
  $scope.index = 1;
  $scope.reward = $scope.rewards[$scope.index];

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
            // TODO: error
          } else if (errorJSON.field == "facebook_id" && errorJSON.code == "already_taken") {
            $scope.rewardError($scope.rewards[1], 'already_taken');
          }
          break;
        case 'unverified':
          $scope.rewards[1].status = 'unverified';
          $scope.rewardError($scope.rewards[1], 'unverified');
          break;
        case 'ineligible_account':
          $scope.rewards[1].status = 'ineligible';
          $scope.rewardError($scope.rewards[1], 'ineligible');
          break;
        case 'fake_account':
        // TODO: inform the user their account is fake
        case 'reward_already_queued':
        case 'reward_limit_reached':
        default:
        // TODO: an error occured message
      }
    } else if (response && response.status == 'error') {
      if (response.code == 'transaction_error') {
        // we've stored the reward but there was an error sending the transaction
        $scope.rewards[1].status = 'awaiting_payout';
        $scope.updateRewards();
      }
    } else {
      $scope.rewards[1].status = 'incomplete';
    }
  }
});
