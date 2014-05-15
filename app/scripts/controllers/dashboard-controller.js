'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $state, loggedIn, session, connectToNetwork) {
  $scope.blob = session.get('blob');
  connectToNetwork();
});
