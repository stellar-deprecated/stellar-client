'use strict';

var sc = angular.module('stellarClient');

sc.controller('DashboardCtrl', function($rootScope, $scope, $timeout, $state, session, TutorialHelper, StellarNetwork, contacts, AccountLines) {
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

    $scope.typeIcons = {
        'sent':     'icon icon-send',
        'received': 'icon icon-receive'
    };

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
        if (tx.type == 'received' || tx.type == 'sent') {
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

    // Account lines only need authorization when authorized is defined and set to false.
    $scope.accountLineNeedsAuth = function(accountLine) {
        return _.has(accountLine, 'authorized') && accountLine.authorized;
    };

    function getAccountLines() {
        AccountLines.get()
            .then(processAccountLines);
    }

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

    $scope.$on('AccountLines:update', function(event, accountLines) {
        processAccountLines(accountLines);
    });

    getAccountLines();

});



