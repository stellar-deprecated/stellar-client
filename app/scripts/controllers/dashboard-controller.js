'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, session, stNetwork) {
    $rootScope.tab = 'none';

    $scope.showTransaction = false;
    $scope.newTransaction = null;
    $scope.username = session.get('username');

    stNetwork.init();

    $scope.closePane = function(){
      $rootScope.tab = 'none';
    };

    $scope.toggleSend = function() {
        if ($rootScope.tab!='send') {
            $rootScope.tab='send';
        } else {
            $rootScope.tab='none';
        }
    };

    $scope.toggleReceive = function() {
        if ($rootScope.tab!='receive') {
            $rootScope.tab='receive';
        } else {
            $rootScope.tab='none';
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



