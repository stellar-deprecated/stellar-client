'use strict';

var sc = angular.module('stellarClient');
/*
    When we are connected to the stellard and we have our account info back from the wallet server,
    Ask the stellard for the account's info
    waits for:
     walletAddressLoaded
 */
sc.controller('AppCtrl', ['$scope','$rootScope','stNetwork', 'session', 'rpReverseFederation', function($scope, $rootScope, $network, session, $reverseFederation) {

    $rootScope.balance=0;
    $rootScope.accountStatus = 'connecting';
    $scope.history = [];
    // implements account listener cleanup, added to $rootScope.account to be called in logout event
    var listenerCleanupFn;

    var myHandleAccountEvent;
    var myHandleAccountEntry;
    var mySetInflation;
    var accountObj;


    $scope.$on('$netConnected', handleAccountLoad); 
    $scope.$on('walletAddressLoaded', function() {
        if ($network.connected) {
            handleAccountLoad();
        }
    }); 

    function reset()
    {
        $rootScope.balance=0;
        $rootScope.accountStatus = 'connecting';
        $scope.history = [];
    }

    function handleAccountLoad() {
        var remote = $network.remote;
        var keys = session.get('signingKeys');
        if(!keys) {
            return;
        }

        reset();

        remote.set_secret(keys.address, keys.secret);

        accountObj = remote.account(keys.address);

        // We need a reference to these functions after they're bound, so we can
        // unregister them if the account is unloaded.
        myHandleAccountEvent = handleAccountEvent;
        myHandleAccountEntry = handleAccountEntry;
        mySetInflation = setInflation;

        accountObj.on('transaction', myHandleAccountEvent);
        accountObj.on('entry', myHandleAccountEntry);
        accountObj.on('entry', mySetInflation);

        listenerCleanupFn = function () {
            accountObj.removeListener("transaction", myHandleAccountEvent);
            accountObj.removeListener("entry", myHandleAccountEntry);
            accountObj.removeListener("entry", mySetInflation);
        }

        remote.once('disconnected', listenerCleanupFn);

        accountObj.entry(function (err, entry) {
            if (err) {
                switch(err.remote.error) {
                    case 'actNotFound':
                        // The account is unfunded.
                        $rootScope.accountStatus = 'loaded';
                        break;
                    default:
                        $rootScope.accountStatus = 'error';
                }
            } else {
                $rootScope.accountStatus = 'loaded';
            }
        });

        // Transactions
        remote.request_account_tx({
            'account': keys.address,
            'ledger_index_min': -1,
            'ledger_index_max': -1,
            'descending': true,
            // TODO: Only request the first page of transactions.
            // 'limit': Options.transactions_per_page,
            'count': true
        })
            .on('success', handleAccountTx)
            .on('error', handleAccountTxError).request();
    };

    function handleAccountEntry(data)
    {
        var remote = $network.remote;
        $scope.$apply(function () {
            $rootScope.account = data;

            // As per json wire format convention, real ledger entries are CamelCase,
            // e.g. OwnerCount, additional convenience fields are lower case, e.g.
            // reserve, max_spend.
            var reserve_base = Amount.from_json(""+remote._reserve_base),
                reserve_inc  = Amount.from_json(""+remote._reserve_inc),
                owner_count  = $rootScope.account.OwnerCount || "0";
            $rootScope.account.reserve_base = reserve_base;
            $rootScope.account.reserve = reserve_base.add(reserve_inc.product_human(owner_count));
            $rootScope.account.reserve_to_add_trust = reserve_base.add(reserve_inc.product_human(owner_count+1));

            // Maximum amount user can spend
            var bal = Amount.from_json(data.Balance);
            $rootScope.balance=data.Balance;
            $rootScope.reserve=$rootScope.account.reserve;
            $rootScope.account.max_spend = bal.subtract($rootScope.account.reserve);
            $rootScope.$broadcast("accountLoaded", $rootScope.account);
        });
    }

    function handleAccountTx(data)
    {
        $scope.$apply(function () {
            $scope.history_count = data.count;

            if (data.transactions) {
                data.transactions.reverse().forEach(function (e) {
                    processTxn(e.tx, e.meta, true);
                });
            }
        });
    }

    function handleAccountTxError(data)
    {

    }

    function handleAccountEvent(e)
    {
        $scope.$apply(function () {
            processTxn(e.transaction, e.meta);
        });
    }

    /**
     * Process a transaction and add it to the history table.
     */
    function processTxn(tx, meta, is_historic)
    {
        var processedTxn = JsonRewriter.processTxn(tx, meta, session.get("address"));

        if (processedTxn) {
            var transaction = processedTxn.transaction;

            // Show status notification
            if (processedTxn.tx_result === "tesSUCCESS" &&
                transaction &&
                !is_historic) {
                $scope.$broadcast('$appTxNotification', transaction);
            }

            // Add to payments history
            if (processedTxn.tx_type === "Payment" &&
                processedTxn.tx_result === "tesSUCCESS" &&
                processedTxn.transaction) {
                var wallet = session.get('wallet');
                var contacts = wallet.mainData.contacts;
                var address = processedTxn.transaction.counterparty;

                if (!contacts[address]) {
                    $reverseFederation.check_address(address)
                        .then(function (result) {
                            if (result) {
                                // add the reverse federation info to the user's wallet
                                contacts[address] = result;
                                session.syncWallet(wallet, "update");
                            }
                        })
                    ;
                }

                $scope.history.unshift(processedTxn);
                $scope.$broadcast('$paymentNotification', transaction);
            }
        }
    }

    function setInflation(account) {
        // TODO: later we should make this not change their inflationdest if it is already set
        if (account.InflationDest !== Options.INFLATION_DEST) {
          var tx = $network.remote.transaction();
          tx = tx.accountSet(account.Account);
          tx.inflationDest(Options.INFLATION_DEST);

          tx.submit();
        }

        accountObj.removeListener("entry", mySetInflation);
    }

}]);
