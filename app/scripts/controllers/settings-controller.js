'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, session){
  var settings = session.get('wallet').mainData;

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

  $scope.toggle = {
    recovery: recoveryToggle,
    email: sendEmailToggle,
    federation: federationToggle
  }

  function recoveryToggle() {

  }

  function sendEmailToggle() {

  }

  function federationToggle() {

  }
});