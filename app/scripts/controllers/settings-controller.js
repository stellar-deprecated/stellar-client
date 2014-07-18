'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, $http, session) {
  var wallet = session.get('wallet');
  var settings = wallet.mainData;

  // Account settings.
  $scope.username = session.get('username');
  $scope.dateFormat = settings.dateFormat;
  $scope.detectTimezone = settings.detectTimezone;
  $scope.receivedSound = settings.receivedSound;
  $scope.sentSound = settings.sentSound;
  $scope.contacts = settings.contacts;

  // Security settings.
  $scope.email = settings.email;
  $scope.password = null;
  $scope.secretKey = wallet.keychainData.signingKeys.secret;

  // Apply the new setting to the session blob and save it to the server.
  // TODO: Change password.
  // TODO: Load contacts from facebook.
  // TODO: Validate input.
  $scope.saveSettings = function(){
    // Store the new setting in the blob.
    settings.dateFormat = $scope.dateFormat;
    settings.detectTimezone = $scope.detectTimezone;
    settings.receivedSound = $scope.receivedSound;
    settings.sentSound = $scope.sentSound;
    settings.contacts = $scope.contacts;
    settings.email = $scope.email;

    // Save the updated blob to the server.
    session.storeBlob();
  }

  $scope.changingPassword = false;

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
    // add the current toggle value to the request
    toggleRequestData.on = $scope.toggle.recovery.on;
    $http.post(Options.API_SERVER + '/user/allowrecovery', toggleRequestData)
    .success(function (res) {
      // TODO
    })
    .error(function (err) {
      // TODO
    });
  }

  function sendEmailToggle() {
    // switch the toggle
    $scope.toggle.email.on = !$scope.toggle.email.on;
    // add the current toggle value to the request
    toggleRequestData.on = $scope.toggle.email.on;
    $http.post(Options.API_SERVER + '/user/allowemail', toggleRequestData)
    .success(function (res) {
      // TODO
    })
    .error(function (err) {
      // TODO
    });
  }

  function federationToggle() {
    // switch the toggle
    $scope.toggle.federation.on = !$scope.toggle.federation.on;
    // add the current toggle value to the request
    toggleRequestData.on = $scope.toggle.federation.on;
    $http.post(Options.API_SERVER + '/user/allowfederate', toggleRequestData)
    .success(function (res) {
      // TODO
    })
    .error(function (err) {
      // TODO
    });
  }
});