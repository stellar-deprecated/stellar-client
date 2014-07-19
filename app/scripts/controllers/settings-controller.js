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
      params: {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
      }
    }
    $http.get(Options.API_SERVER + "/user/settings", data)
    .success(function (response) {
      console.log(response);
      $scope.toggle.recover.on = response.data.recover;
      $scope.toggle.federate.on = response.data.federate;
      $scope.toggle.email.on = response.data.email;
    })
    .error(function (response) {
      $scope.toggle.disableToggles = true;
      // TODO retry
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
    recover: {
      click: recoverToggle,
      on: false
    },
    email: {
      click: emailToggle,
      on: false
    },
    federate: {
      click: federateToggle,
      on: false
    }
  }

  var toggleRequestData = {
    username: session.get('username'),
    updateToken: session.get('wallet').keychainData.updateToken
  };

  function recoverToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.recover.on = !$scope.toggle.recover.on;
    var on = $scope.toggle.recover.on;
    // add the current toggle value to the request
    toggleRequestData.recover = on;
    $http.post(Options.API_SERVER + '/user/setrecover', toggleRequestData)
    .success(function (res) {
      $scope.toggle.recover.on = on;
    })
    .error(function (err) {
      $scope.toggle.recover.on = !on;
    });
  }

  function emailToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.email.on = !$scope.toggle.email.on;
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

  function federateToggle() {
    if ($scope.toggle.disableToggles) {
      return;
    }
    // switch the toggle
    $scope.toggle.federate.on = !$scope.toggle.federate.on;
    var on = $scope.toggle.federate.on;
    // add the current toggle value to the request
    toggleRequestData.federate = on;
    $http.post(Options.API_SERVER + '/user/setfederate', toggleRequestData)
    .success(function (res) {
      $scope.toggle.federate.on = on;
    })
    .error(function (err) {
      $scope.toggle.federate.on = !on;
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