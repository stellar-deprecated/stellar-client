'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, session, TutorialHelper, $translate) {
    $rootScope.tab = 'none';
    $rootScope.showTab = false;

    $scope.showTransaction = false;
    $scope.newTransaction = null;
    $scope.username = session.get('username');
    $scope.tutorials = TutorialHelper;

    $rootScope.closePane = function(){
      $rootScope.showTab = false;
    };

    $rootScope.openSend = function() {
        $scope.$broadcast('resetSendPane');
        $rootScope.tab = 'send';
        $rootScope.showTab = true;
        TutorialHelper.clear('dashboard');
    };

    $rootScope.openReceive = function() {
        $rootScope.tab = 'receive';
        $rootScope.showTab = true;
    };

    $scope.statusMessage = function(){
        switch($rootScope.accountStatus){
          case 'connecting': return $translate.instant('global.connecting');
          case 'loaded':     return $translate.instant('global.connected');
          case 'error':      return $translate.instant('global.connection_error');
        }
    };

    var cleanupTimer = null;

    // Show a notification when new transactions are received.
    $scope.$on('$appTxNotification', function(event, tx){
        if (tx.type == 'received') {
            $scope.showTransaction = true;
            $scope.newTransaction = tx;

            if (cleanupTimer) {
                $timeout.cancel(cleanupTimer);
            }

            cleanupTimer = $timeout(function () {
                $scope.showTransaction = false;
                cleanupTimer = null;
            }, 10000);
        }
    });

    // Dismiss the transaction notification.
    $scope.clearNotification = function() {
        $timeout.cancel(cleanupTimer);
        $scope.showTransaction = false;
    };
});



