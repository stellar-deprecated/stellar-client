'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, $http, $q, $timeout, session) {
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
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken
    }
    $http.get(Options.API_SERVER + "/settings", data)
    .success(function (response) {
      $scope.toggle.recovery.on = response.data.recovery;
      $scope.toggle.email.on = response.data.email;
      $scope.toggle.email.federation = response.data.federation;
    })
    .error(function (response) {
      $scope.toggle.disableToggles = true;
      $timeout(function() {
        getSettings();
      }, 5000);
    });
  }

  $scope.saveSettings = function(){
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
    recovery: {
      click: recoveryToggle,
      on: false
    },
    email: {
      click: sendEmailToggle,
      on: false
    },
    federation: {
      click: federationToggle,
      on: false
    }
  }

  var toggleRequestData = {
    username: session.get('username'),
    updateToken: session.get('wallet').keychainData.updateToken
  };

  function recoveryToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.recovery.on = !$scope.toggle.recovery.on;
    var on = $scope.toggle.recovery.on;
    // add the current toggle value to the request
    toggleRequestData.on = on;
    $http.post(Options.API_SERVER + '/user/allowrecovery', toggleRequestData)
    .success(function (res) {
      $scope.toggle.recovery.on = on;
    })
    .error(function (err) {
      $scope.toggle.recovery.on = !on;
    });
  }

  function sendEmailToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.email.on = !$scope.toggle.recovery.on;
    var on = $scope.toggle.email.on;
    var config = {
      params: {
        email: $scope.email
      }
    };
    var endpoint = on ? '/subscribe' : '/unsubscribe';
    $http.get(Options.API_SERVER + endpoint, config)
    .success(function (res) {
      $scope.toggle.email.on = on;
    })
    .error(function (err) {
      $scope.toggle.email.on = !on;
    });
  }

  function federationToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.federation.on = !$scope.toggle.recovery.on;
    var on = $scope.toggle.federation.on;
    // add the current toggle value to the request
    toggleRequestData.on = on;
    $http.post(Options.API_SERVER + '/user/allowfederate', toggleRequestData)
    .success(function (res) {
      $scope.toggle.federation.on = on;
    })
    .error(function (err) {
      $scope.toggle.federation.on = !on;
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

  getSettings();
});