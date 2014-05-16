'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $state, session) {
  $scope.blob = session.get('blob');
    $rootScope.tab= 'none';

    session.connect();


    $scope.toggleSend = function() {
        //console.log("send");
        if($rootScope.tab!='send') $rootScope.tab='send';
        else $rootScope.tab='none';
    }

    $scope.toggleReceive = function() {
        if($rootScope.tab!='receive') $rootScope.tab='receive';
        else $rootScope.tab='none';
    }
});
