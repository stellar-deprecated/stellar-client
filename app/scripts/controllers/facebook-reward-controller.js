'use strict';

var sc = angular.module('stellarClient');

sc.controller('FacebookRewardCtrl', function ($rootScope, $scope, $http, $q, $analytics, session, Facebook) {

  $scope.$on('action-verify-facebook-email', function(event, params){
    if($scope.reward.status === 'sent') { return; }

    // Claim the facebook reward with the confirmation code.
    claimFacebookReward(params.code)
      .finally(function () {
      // Open the facebook reward pane.
        $scope.selectedReward = $scope.reward.rewardType;
      });
  });

  $scope.reward = {
    rewardType: 1,
    status: 'incomplete',
    innerTitle: 'Receive stellars',
    getCopy: function() {
      switch ($scope.reward.status) {
        case 'fb_email_unverified':
          return {
            title: 'You connected your Facebook!',
            subtitle: 'Check the email linked to your facebook account to claim your stellars.'
          };
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
        case 'updated_too_recently':
          return {
            title: "Your Facebook was updated too recently.",
            subtitle: "Please try again in a couple of days"
          };
        case 'fb_email_missing':
          return {
            title: "Your Facebook account does not have an email address.",
            subtitle: "Please add an email address to your Facebook account."
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
        case 'updated_too_recently':
          $scope.reward.error = {};
          $scope.reward.error.info = "As part of our ongoing efforts to prevent fraud, we temporarily deny facebook accounts that have been updated too recently.  Please try again in a couple of days.";
          $scope.reward.error.panel = "Sorry, your Facebook account was updated too recently";
          $scope.reward.error.action = null;
          break;
        case 'fb_email_missing':
          $scope.reward.error = {};
          $scope.reward.error.info = "Your Facebook account does not have an email address.";
          $scope.reward.error.panel = "Please add an email address to your Facebook account.";
          $scope.reward.error.action = null;
          break;
        case 'invalid_fb_email_token':
          $scope.reward.error = {};
          $scope.reward.error.info = "The email verification token is invalid";
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
        case 'facebook_error':
          $scope.reward.error = {};
          $scope.reward.error.info = "Error getting Facebook details.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'already_linked':
          $scope.reward.error = {};
          $scope.reward.error.info = "Another Facebook is already linked to your account.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'facebook_error':
          $scope.reward.error = {};
          $scope.reward.error.info = "An error occurred while getting your Facebook information.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'reward_already_queued':
          $scope.reward.error = {};
          $scope.reward.error.info = "You've already claimed this reward.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'server_error':
          $scope.reward.error = {};
          $scope.reward.error.info = "Server error.";
          $scope.reward.error.action = function () {
            $scope.reward.error = null;
            $scope.reward.status = 'incomplete';
          };
          break;
        case 'client_error':
          $scope.reward.error = {};
          $scope.reward.error.info = "There was a problem with your request.";
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

  $scope.isFacebookReady = function () {
    return Facebook.isReady();
  };

  /**
  * Facebook login the user, add their Facebook data to their user account, and then
  * claim their Facebook reward.
  */
  $scope.connectWithFacebook = function() {
    $scope.loading = true;
    facebookLogin()
      .then(function (data) {
        if (session.getUser().hasLinkedFacebook()) {
          // update the auth token using their reauthenticated token
          return updateUserFacebookToken(data);
        } else {
          // add the facebook to the user's account
          return linkUserFacebook(data);
        }
      })
      .then(function() {
        return claimFacebookReward();
      })
      .then(function () {
        $scope.updateRewards();
      })
      .finally(function () {
        $scope.loading = false;
      });
  };

  function facebookLogin() {
    /*jshint camelcase: false */
    var deferred = $q.defer();

    Facebook.login(function(response) {
      if (response.authResponse) {
        var data = {};
        data.fbID = response.authResponse.userID;
        data.fbAccessToken = response.authResponse.accessToken;
        deferred.resolve(data);
      } else {
        onFacebookLoginError(response);
        deferred.reject(response);
      }
    }, {scope: 'user_photos,email', auth_type: 'reauthenticate'});

    return deferred.promise;
  }

  function onFacebookLoginError(response) {
    $scope.reward.updateReward('facebook_error');
  }

  /**
  * Links the given facebook data to the user's account.
  */
  function linkUserFacebook(data) {
    _.extend(data, {
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken
    });

    return $http.post(Options.API_SERVER + "/user/add_facebook", data)
      .success(function(response) {
        session.getUser().linkedFacebook = true;
        session.identifyToAnalytics();
        $analytics.eventTrack('Facebook Connected');
        return response;
      })
      .error(function (response) {
        onLinkUserFacebookError(response, data);
      });
  }

  function updateUserFacebookToken(data) {
    _.extend(data, {
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken
    });

    return $http.post(Options.API_SERVER + "/user/update_facebook_token", data)
      .error(function (response) {
        onLinkUserFacebookError(response, data);
      });
  }

  function onLinkUserFacebookError(response, data) {
    if (response && response.status === 'fail') {
      switch (response.code) {
        case 'already_taken':
          $scope.reward.updateReward('already_taken');
          break;
        case 'already_linked':
        case 'bad_token':
          $scope.reward.updateReward('already_linked');
          break;
        case 'facebook_error':
          $scope.reward.updateReward('facebook_error');
          break;
        default:
          $scope.reward.updateReward('client_error');
          break;
      }
    } else {
      $scope.reward.updateReward('server_error');
    }

    $analytics.eventTrack('Facebook Failed', {reason: response.code});
  }

/**
 * Send the facebook auth data to the server to be verified and saved.
 */
  function claimFacebookReward(code) {
    var data = {
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken,
      verificationToken: code
    };

    return $http.post(Options.API_SERVER + "/claim/facebook", data)
      .success(function (response) {
        $scope.reward.status = response.message;
        $scope.updateRewards();
      })
      .error(onClaimFacebookRewardError);
  }

  function onClaimFacebookRewardError(response) {
    if (response && response.status === 'fail') {
      switch (response.code) {
        case 'unverified':
          $scope.reward.updateReward('unverified');
          break;
        case 'ineligible':
          $scope.reward.updateReward('ineligible');
          break;
        case 'updated_too_recently':
          $scope.reward.updateReward('updated_too_recently');
          break;
        case 'fb_email_unverified':
          $scope.reward.updateReward('fb_email_unverified');
          break;
        case 'invalid_fb_email_token':
          $scope.reward.updateReward('invalid_fb_email_token');
          break;
        case 'fake_account':
          $scope.reward.updateReward('fake');
          break;
        case 'reward_already_queued':
          $scope.reward.updateReward('reward_already_queued');
          break;
        default:
          $scope.reward.updateReward('client_error');
      }
    } else {
      $scope.reward.updateReward('server_error');
    }
  }
});
