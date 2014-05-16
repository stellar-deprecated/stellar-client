'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $state, session) {
  $scope.blob = session.get('blob');
});
