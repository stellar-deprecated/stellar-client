'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, $http, $q, session) {
  var wallet = session.get('wallet');

  $scope.email = wallet.mainData.email;

  $scope.secretKey = wallet.keychainData.signingKeys.secret;

  $scope.errors = {
    emailError:           null,
    passwordError:        null,
    passwordConfirmError: null
  };

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
    // switch the toggle
    $scope.toggle.email.on = !$scope.toggle.recovery.on;
    var on = $scope.toggle.email.on;
    // add the current toggle value to the request
    toggleRequestData.on = on;
    $http.post(Options.API_SERVER + '/user/allowemail', toggleRequestData)
    .success(function (res) {
      $scope.toggle.email.on = on;
    })
    .error(function (err) {
      $scope.toggle.email.on = !on;
    });
  }

  function federationToggle() {
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
});