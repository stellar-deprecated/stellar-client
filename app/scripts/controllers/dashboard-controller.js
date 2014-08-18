'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, $q, session, TutorialHelper, stNetwork) {
    $rootScope.tab = 'none';
    $rootScope.showTab = false;

    $scope.showTransaction = false;
    $scope.newTransaction = null;
    $scope.username = session.get('username');
    $scope.tutorials = TutorialHelper;

    $scope.accountLines = [];
    $scope.balances = {};
    $scope.currencies = [];
    $scope.topCurrencies = [];

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
          case 'connecting': return 'Connecting...';
          case 'loaded':     return 'Connected!';
          case 'error':      return 'Connection error!';
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

    $scope.fetchCurrencies = function (){
        var deferred = $q.defer();

        var remote = stNetwork.remote;
        var accountLinesRequest = remote.request_account_lines({
            'account': session.get('address')
        });

        accountLinesRequest.on('success', function(result) {
            processAccountLines(result.lines);
            deferred.resolve();
        });
        accountLinesRequest.request();

        return deferred.promise;
    };

    function processAccountLines(accountLines) {
        $scope.accountLines = accountLines;

        accountLines.forEach(function(accountLine) {
            var balance = Number(accountLine.balance);

            if (balance != 0) {
                var currency = accountLine.currency;
                $scope.balances[currency] = ($scope.balances[currency] || 0) + balance;
            }
        });

        $scope.currencies = Object.getOwnPropertyNames($scope.balances);

        var sortedCurrencies = $scope.currencies.sort(function(a, b) {
            return $scope.balances[b] - $scope.balances[a];
        });
        $scope.topCurrencies = sortedCurrencies.slice(0, 2);
    }

    $scope.fetchCurrencies();
});



