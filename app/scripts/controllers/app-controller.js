'use strict';

var sc = angular.module('stellarClient');
/*
    When we are connected to the stellard and we have our account info back from the wallet server,
    Ask the stellard for the account's info
    waits for:
     $idAccountLoad
 */
sc.controller('AppCtrl', ['$scope','stNetwork', function($scope, $network) {

    var myHandleAccountEvent;
    var myHandleAccountEntry;
    function handleAccountLoad(e, data)
    {
        var remote = $network.remote;

        account = data.account;

        reset();

        remote.set_secret(data.account, data.secret);

        var accountObj = remote.account(data.account);

        // We need a reference to these functions after they're bound, so we can
        // unregister them if the account is unloaded.
        myHandleAccountEvent = handleAccountEvent;
        myHandleAccountEntry = handleAccountEntry;

        accountObj.on('transaction', myHandleAccountEvent);
        accountObj.on('entry', myHandleAccountEntry);

        accountObj.entry(function (err, entry) {
            if (err) {
                // XXX: Our account does not exist, we should do something with that
                //      knowledge.
            }
        });

        // Ripple credit lines
        remote.request_account_lines(data.account)
            .on('success', handleRippleLines)
            .on('error', handleRippleLinesError).request();

        // Transactions
        remote.request_account_tx({
            'account': data.account,
            'ledger_index_min': 0,
            'ledger_index_max': 9999999,
            'descending': true,
            'limit': Options.transactions_per_page,
            'count': true
        })
            .on('success', handleAccountTx)
            .on('error', handleAccountTxError).request();

        // Outstanding offers
        remote.request_account_offers(data.account)
            .on('success', handleOffers)
            .on('error', handleOffersError).request();
    };

    $scope.$on('$idAccountLoad', function (e, data) {
        // Server is connected
        if ($network.connected) {
            handleAccountLoad(e, data);
        }

        // Server is not connected yet. Handle account load after server response
        $scope.$on('$netConnected', function(){
            handleAccountLoad(e, data);
        });
    });

    var removeFirstConnectionListener =
        $scope.$on('$netConnected', handleFirstConnection);



    function handleFirstConnection() {
        removeFirstConnectionListener();
    }

}]);
