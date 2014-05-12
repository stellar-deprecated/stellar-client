'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($scope, $state, session) {
  if(!session.get('loggedIn') || !session.get('blob')){
    $state.go('login');
    return;
  }

  $scope.blob = session.get('blob');
});
