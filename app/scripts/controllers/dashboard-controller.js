'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, session, stNetwork) {
  $scope.blob = session.get('blob');
    $rootScope.tab = 'none';

    $scope.showTransaction = false;
    $scope.newTransaction = null;

    stNetwork.init();

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



