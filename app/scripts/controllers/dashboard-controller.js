'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, session, TutorialHelper, stNetwork, contacts) {
    $rootScope.tab = 'none';
    $rootScope.showTab = false;

    $scope.showTransaction = false;
    $scope.newTransaction = null;
    $scope.username = session.get('username');
    $scope.tutorials = TutorialHelper;

    $scope.accountLines = [];
    $scope.nonZeroAccountLines = [];
    $scope.balances = {};
    $scope.currencies = [];
    $scope.topCurrencies = [];

    $rootScope.closePane = function(){
      $rootScope.showTab = false;
      $rootScope.overflowVisible = false;
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

    $rootScope.openBalances = function() {
        $rootScope.tab = 'balances';
        $rootScope.showTab = true;
    };

    $rootScope.openManageCurrencies = function() {
        $rootScope.tab = 'manage-currencies';
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

    function fetchCurrencies() {
        var remote = stNetwork.remote;
        var accountLinesRequest = remote.request_account_lines({
            'account': session.get('address')
        });

        accountLinesRequest.on('success', function(result) {
            $scope.$apply(function() {
                processAccountLines(result.lines);
            });
        });

        accountLinesRequest.request();
    };

    function processAccountLines(accountLines) {
        $scope.accountLines = accountLines;
        $scope.balances = {};

        // Filter out account lines with zero balances.
        $scope.nonZeroAccountLines = accountLines.filter(function(accountLine) {
            return accountLine.balance != '0';
        });

        $scope.nonZeroAccountLines.forEach(function(accountLine) {
            var balance = Number(accountLine.balance);
            var currency = accountLine.currency;
            $scope.balances[currency] = ($scope.balances[currency] || 0) + balance;

            contacts.fetchContactByAddress(accountLine.account);
        });

        $scope.currencies = Object.getOwnPropertyNames($scope.balances);

        var sortedCurrencies = $scope.currencies.sort(function(a, b) {
            return $scope.balances[b] - $scope.balances[a];
        });
        $scope.topCurrencies = sortedCurrencies.slice(0, 2);
    }

    $rootScope.$on('$appTxNotification', fetchCurrencies);

    fetchCurrencies();
});



