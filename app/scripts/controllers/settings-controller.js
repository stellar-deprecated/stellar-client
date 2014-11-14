'use strict';

angular.module('stellarClient').controller('SettingsCtrl', function($scope, $http, $state, $stateParams, session, FlashMessages) {
  if ($stateParams['migrated-wallet-recovery']) {
    $scope.migratedWalletRecovery = true;
    FlashMessages.add({
      id: 'migrated-wallet-recovery-step-1',
      info: 'Step 1: Click on "reset" to reset your recovery code.',
      showCloseIcon: false
    });
  }

  var wallet = session.get('wallet');
  var walletV2 = session.get('wallet').walletV2;

  $scope.secretKey = wallet.keychainData.signingKeys.secret;

  $scope.handleServerError = function (element) {
    return function (error) {
      var message = error.data.status === 'fail' ? error.data.message : 'Server error';
      Util.showTooltip(element, message, 'error', 'top');
    };
  };

  $scope.refreshAndInitialize = function () {
    return session.getUser().refresh()
      .then(function () {
        $scope.$broadcast('settings-refresh');
      });
  };

  // TODO: move into user object and initialize settings
  function getSettings() {
    var data = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    };

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

  // We need to reload settings in SettingsRecoveryCtrl
  $scope.getSettings = getSettings;

  $scope.toggle = {
    disableToggles: false,
    error: null,
    recover: {
      NAME: "recover",
      click: toggleRecovery,
      on: false
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
      on: wallet.get('mainData', 'showRewards', true),
      wrapper: angular.element('#rewardstoggle')
    },
    trading: {
      NAME: "trading",
      click: toggleTrading,
      on: wallet.get('mainData', 'showTrading', true),
      wrapper: angular.element('#tradingtoggle')
    },
    twofa: {
      NAME: "2fa",
      click: toggle2FA,
      on: walletV2.isTotpEnabled()
    }
  };

  function toggleWalletSetting(toggle, settingName) {
    toggle.on = !toggle.on;
    wallet.set('mainData', settingName, toggle.on);
    return session.syncWallet('update')
      .catch(function() {
        showError(toggle.wrapper, 'Unable to save setting.');
      });
  }

  function toggleRewards(showRewardsToggle) {
    return toggleWalletSetting(showRewardsToggle, 'showRewards');
  }

  function toggleTrading(showTradingToggle) {
    return toggleWalletSetting(showTradingToggle, 'showTrading');
  }

  function toggle2FA(toggle) {
    if (session.get('wallet').version === 1) {
      // Actually this will never happen as wallets are migrated to V2 during login.
      console.log('You need to migrate your wallet to use 2 Factor Authentication.');
      return;
    }
    $scope.$broadcast('settings-totp-clicked', toggle);
  }

  function toggleRecovery(toggle) {
    $scope.$broadcast('settings-recovery-clicked', toggle);
  }

  $scope.$on('settings-totp-toggled', function($event, value) {
    $scope.toggle.twofa.on = value;
    $event.stopPropagation();
  });

  $scope.$on('settings-recovery-toggled', function($event, value) {
    $scope.toggle.recover.on = value;
    $event.stopPropagation();
  });

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
          if(err.code === 'validation_error') {
            if (err.data && err.data.field === 'update_token') {
              // this user's update token is invalid, send to login
              $state.transitionTo('login');
            }
          }
        } else {
          showError(toggle.wrapper, "Server error.");
        }
      });
  }

  function showError(wrapper, title) {
    wrapper.tooltip(
      {
        title: title,
        delay: 1000
      })
      .tooltip('show');
  }

  $scope.idleTimeout = session.get('wallet').getIdleLogoutTime();
  $scope.timeoutOptions = [
    {text: '15 minutes', time:  15 * 60 * 1000},
    {text: '30 minutes', time:  30 * 60 * 1000},
    {text: '1 hour',     time:  60 * 60 * 1000},
    {text: '2 hours',    time: 120 * 60 * 1000},
  ];

  $scope.$watch('idleTimeout', function() {
    var currentIdleTimeout = session.get('wallet').getIdleLogoutTime();

    if ($scope.idleTimeout && $scope.idleTimeout !== currentIdleTimeout) {
      wallet.set('mainData', 'idleLogoutTime', $scope.idleTimeout);
      session.syncWallet('update');
    }
  });

  getSettings().then(function () {
    $scope.$broadcast('settings-refresh');
  });
});
