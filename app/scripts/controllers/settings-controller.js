'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, $http, $q, $timeout, $state, session) {
  var wallet = session.get('wallet');

  $scope.email = wallet.mainData.email;

  $scope.secretKey = wallet.keychainData.signingKeys.secret;

  $scope.errors = {
    emailError:           null,
    passwordError:        null,
    passwordConfirmError: null
  };

  function getSettings() {
    var data = {
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    }
    $http.get(Options.API_SERVER + "/user/settings", data)
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

  $scope.saveSettings = function() {
    /*
    var email = $scope.newEmail;
    updateEmail(email)
    .then(function (success) {
      $scope.settings.email = email;
      return updatePassword;
    }, function (error) {
      $scope.errors.emailError = error;
      return updatePassword;
    })
    .then(function (success) {

    }, function (error) {

    })
    */
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
    }
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

  function updateEmail(email) {
    var promise = $q.defer();
    if ($scope.newEmail == '') {
      promise.resolve();
    }
    if (!Util.validateEmail($scope.newEmail)) {
      promise.reject("Invalid email");
    }
    var data = {
      email: email,
      username: session.get('username'),
      updateToken: wallet.keychainData.updateToken
    };
    return $http.post(Options.API_SERVER + '/user/email', data)
    .success(function (response) {
      promise.resolve();
    })
    .error(function (response) {
      promise.reject(response.message);
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

  getSettings();
});
