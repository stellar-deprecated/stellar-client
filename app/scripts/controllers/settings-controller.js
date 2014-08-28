'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, $http, $state, session, singletonPromise) {
  var wallet = session.get('wallet');

  $scope.secretKey = wallet.keychainData.signingKeys.secret;

  $scope.handleServerError = function (element) {
    return function (error) {
      var message = error.status == 'fail' ? error.message : 'Server error';
      Util.showTooltip(element, message, 'error', 'top');
    }
  }

  $scope.refreshAndInitialize = function () {
    return session.getUser().refresh()
      .then(function () {
        $scope.$broadcast('settings-refresh');
      })
  }

  // TODO: move into user object and initialize settings
  function getSettings() {
    var data = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    }
    return $http.get(Options.API_SERVER + "/user/settings", data)
    .success(function (response) {
      $scope.toggle.recover.on = response.data.recover;
      $scope.toggle.federate.on = response.data.federate;
      $scope.toggle.email.on = response.data.email;
    })
    .error(function (response) {
      $scope.toggle.error = "Server error";
      $scope.toggle.disableToggles = true;
      // TODO retry
    });
  }

  $scope.toggle = {
    disableToggles: false,
    error: null,
    recover: {
      NAME: "recover",
      API_ENDPOINT: "/user/setrecover",
      click: switchToggle,
      on: false,
      wrapper: angular.element('#recovertoggle')
    },
    email: {
      NAME: "email",
      API_ENDPOINT: "/user/setsubscribe",
      click: switchToggle,
      on: false,
      wrapper: angular.element('#emailtoggle')
    },
    federate: {
      NAME: "federate",
      API_ENDPOINT: "/user/setfederate",
      click: switchToggle,
      on: false,
      wrapper: angular.element('#federatetoggle')
    },
    rewards: {
      NAME: "rewards",
      click: toggleRewards,
      on: !_.has(wallet.mainData, 'showRewards') || wallet.mainData.showRewards,
      wrapper: angular.element('#rewardstoggle')
    }
  }

  function toggleRewards(showRewardsToggle) {
    showRewardsToggle.on = !showRewardsToggle.on;
    wallet.mainData.showRewards = showRewardsToggle.on;
    session.syncWallet('update');
  }

  var toggleRequestData = {
    username: session.get('username'),
    updateToken: session.get('wallet').keychainData.updateToken
  };
  function switchToggle(toggle) {
    if ($scope.toggle.disableToggles) {
      if ($scope.toggle.error) {
        // if we're disabling these toggles, let the user know
        showError(toggle.wrapper, "Server error.");
      }
      return;
    }
    if (toggle.error) {
      toggle.error = null;
    }
    // save the toggle's current state
    var on = toggle.on;
    // add the current toggle value to the request
    toggleRequestData[toggle.NAME] = !on;
    $http.post(Options.API_SERVER + toggle.API_ENDPOINT, toggleRequestData)
    .success(function (res) {
      // switch the toggle
      toggle.on = !on;
    })
    .error(function (err, status) {
      if (status < 500 && status > 400) {
        switch (err.code) {
          case "validation_error":
            if (err.data && err.data.field == "update_token") {
              // this user's update token is invalid, send to login
              $state.transitionTo('login');
            }
        }
      } else {
        showError(toggle.wrapper, "Server error.");
      }
    });
  }

  function updatePassword(password) {
    // TODO
  }

  function showError(wrapper, title) {
    wrapper.tooltip(
      {
        title: title,
        delay: 1000
      })
      .tooltip('show');
  }

  getSettings()
    .then(function () {
      $scope.$broadcast('settings-refresh');
    })
});

sc.controller('SettingsEmailCtrl', function($scope, $http, session, singletonPromise) {

  $scope.$on('settings-refresh', function () {
    $scope.email = session.getUser().getEmailAddress();
    $scope.emailVerified = session.getUser().isEmailVerified();
    $scope.resetEmailState();
  });

  $scope.resetEmailState = function () {
    if ($scope.email) {
      $scope.emailState = 'added';
    } else {
      $scope.emailState = 'none';
    }
  }

  $scope.getEmailState = function () {
    return $scope.emailState;
  }

  $scope.setEmailState = function (state) {
    $scope.emailState = state;
  }

  $scope.emailAction = singletonPromise(function () {
    if ($scope.emailState == 'change') {
      return changeEmail();
    } else if ($scope.emailState == 'verify') {
      return verifyEmail();
    } else {
      return;
    }
  });

  function verifyEmail () {
    var verifyToken = $scope.verifyToken;
    return session.getUser().verifyEmail(verifyToken)
      .then(function (response) {
        if (response.data.data && response.data.data.serverRecoveryCode) {
          return session.get('wallet').storeRecoveryData(verifyToken, response.data.data.serverRecoveryCode);
        }
      })
      .then(function () {
        return $scope.refreshAndInitialize();
      })
      .then(function () {
        $scope.verifyToken = null;
      })
      .catch($scope.handleServerError($('#email-input')));
  };

  function changeEmail () {
    return session.getUser().changeEmail($scope.newEmail)
      .then(function () {
        return $scope.refreshAndInitialize();
      })
      .then(function () {
        $scope.newEmail = null;
      })
      .catch($scope.handleServerError($('#verify-input')));
  };
});
