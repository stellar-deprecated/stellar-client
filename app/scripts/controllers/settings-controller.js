'use strict';

var sc = angular.module('stellarClient');

sc.controller('SettingsCtrl', function($scope, session, loggedIn){
  if(!loggedIn()) return;

  var settings = session.get('blob').data;

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
});