'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($scope, $state, loggedIn, session) {
  if(!loggedIn()) return;

  $scope.blob = session.get('blob');
});
