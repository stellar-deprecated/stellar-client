'use strict';

var sc = angular.module('stellarClient');
/*
    When we are connected to the stellard and we have our account info back from the wallet server,
    Ask the stellard for the account's info
    waits for:
     walletAddressLoaded
 */
sc.controller('AppCtrl', ['$scope','$rootScope','stNetwork', 'session', function($scope, $rootScope, $network, session) {

    $rootScope.balance=0;
    $rootScope.accountStatus = 'connecting';
    $scope.events = [];
    $scope.history = [];

    var account;
    // implements account listener cleanup, added to $rootScope.account to be called in logout event
    var listenerCleanupFn;

    function reset()
    {
        $rootScope.balance=0;
        $rootScope.accountStatus = 'connecting';
        $scope.events = [];
        $scope.history = [];
        /*
        $scope.account = {};
        $scope.lines = {};
        $scope.offers = {};
        $scope.balances = {};
        */
    }

    var myHandleAccountEvent;
    var myHandleAccountEntry;
    var mySetInflation;
    var accountObj;
    function handleAccountLoad(e, data)
    {
        var remote = $network.remote;

        account=data.account;

        reset();

        remote.set_secret(data.account, data.secret);

        accountObj = remote.account(data.account);

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
        }

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

    $scope.$on('walletAddressLoaded', function (e, data) {
        $rootScope.account=data.account;

        // Server is connected
        if ($network.connected) {
            handleAccountLoad(e, data);
        }


        // Server is not connected yet. Handle account load after server response
        $scope.$on('$netConnected', function(){
            handleAccountLoad(e, data);
        });
    });

    function handleRippleLines(data)
    {
        $scope.$apply(function () {
            $scope.lines = {};

            for (var n=0, l=data.lines.length; n<l; n++) {
                var line = data.lines[n];

                // XXX: This reinterpretation of the server response should be in the
                //      library upstream.
                line = $.extend({}, line, {
                    limit: ripple.Amount.from_json({value: line.limit, currency: line.currency, issuer: line.account}),
                    limit_peer: ripple.Amount.from_json({value: line.limit_peer, currency: line.currency, issuer: account}),
                    balance: ripple.Amount.from_json({value: line.balance, currency: line.currency, issuer: account})
                });

                $scope.lines[line.account+line.currency] = line;
                updateRippleBalance(line.currency, line.account, line.balance);
            }
            console.log('lines updated:', $scope.lines);
        });
    }

    function handleRippleLinesError(data)
    {
    }

    function handleOffers(data)
    {
        $scope.$apply(function () {
            data.offers.forEach(function (offerData) {
                var offer = {
                    seq: +offerData.seq,
                    gets: ripple.Amount.from_json(offerData.taker_gets),
                    pays: ripple.Amount.from_json(offerData.taker_pays)
                };

                updateOffer(offer);
            });
            console.log('offers updated:', $scope.offers);
        });
    }

    function handleOffersError(data)
    {
    }

    function handleAccountEntry(data)
    {
        var remote = $network.remote;
        $scope.$apply(function () {
            $rootScope.account = data;

            // add a cleanup function to account to remove the listeners
            $rootScope.account.cleanup = listenerCleanupFn;

            // As per json wire format convention, real ledger entries are CamelCase,
            // e.g. OwnerCount, additional convenience fields are lower case, e.g.
            // reserve, max_spend.
            var reserve_base = Amount.from_json(""+remote._reserve_base),
                reserve_inc  = Amount.from_json(""+remote._reserve_inc),
                owner_count  = $scope.account.OwnerCount || "0";
            $rootScope.account.reserve_base = reserve_base;
            $rootScope.account.reserve = reserve_base.add(reserve_inc.product_human(owner_count));
            $rootScope.account.reserve_to_add_trust = reserve_base.add(reserve_inc.product_human(owner_count+1));

            // Maximum amount user can spend
            var bal = Amount.from_json(data.Balance);
            $rootScope.balance=data.Balance;
            $rootScope.reserve=$scope.account.reserve;
            $rootScope.account.max_spend = bal.subtract($scope.account.reserve);
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
        var processedTxn = JsonRewriter.processTxn(tx, meta, account);

        if (processedTxn) {
            var transaction = processedTxn.transaction;

            // Show status notification
            if (processedTxn.tx_result === "tesSUCCESS" &&
                transaction &&
                !is_historic) {
                $scope.$broadcast('$appTxNotification', transaction);
            }

            // Add to recent notifications
            if (processedTxn.tx_result === "tesSUCCESS") {
                $scope.events.unshift(processedTxn);
            }

            // Add to payments history
            if (processedTxn.tx_type === "Payment" &&
                processedTxn.tx_result === "tesSUCCESS" &&
                processedTxn.transaction) {
                $scope.history.unshift(processedTxn);
                $scope.$broadcast('$paymentNotification', transaction);
            }

            // Update Ripple lines
            if (processedTxn.effects && !is_historic) {
                updateLines(processedTxn.effects);
            }

            // Update my offers
            if (processedTxn.effects && !is_historic) {
                // Iterate on each effect to find offers
                processedTxn.effects.forEach(function (effect) {
                    // Only these types are offers
                    if (_.contains([
                        'offer_created',
                        'offer_funded',
                        'offer_partially_funded',
                        'offer_cancelled'], effect.type))
                    {
                        var offer = {
                            seq: +effect.seq,
                            gets: effect.gets,
                            pays: effect.pays,
                            deleted: effect.deleted
                        };

                        updateOffer(offer);
                    }
                });
            }
        }
    }

    function updateOffer(offer)
    {
        var reverseOrder = null;
        var pairs = $scope.pairs;
        for (var i = 0, l = pairs.length; i < l; i++) {
            var pair = pairs[i].name;
            if (pair.slice(0,3) == offer.gets.currency().to_json() &&
                pair.slice(4,7) == offer.pays.currency().to_json()) {
                reverseOrder = false;
                break;
            } else if (pair.slice(0,3) == offer.pays.currency().to_json() &&
                pair.slice(4,7) == offer.gets.currency().to_json())  {
                reverseOrder = true;
                break;
            }
        }

        // TODO: Sensible default for undefined pairs
        if (reverseOrder === null) {
            reverseOrder = false;
        }

        if (reverseOrder) {
            offer.type = 'buy';
            offer.first = offer.pays;
            offer.second = offer.gets;
        } else {
            offer.type = 'sell';
            offer.first = offer.gets;
            offer.second = offer.pays;
        }

        if (!offer.deleted) {
            $scope.offers[""+offer.seq] = offer;
        } else {
            delete $scope.offers[""+offer.seq];
        }
    }
    function updateLines(effects)
    {
        if (!$.isArray(effects)) return;

        $.each(effects, function () {
            if (_.contains([
                'trust_create_local',
                'trust_create_remote',
                'trust_change_local',
                'trust_change_remote',
                'trust_change_balance'], this.type))
            {
                var effect = this,
                    line = {},
                    index = effect.counterparty + effect.currency;

                line.currency = effect.currency;
                line.account = effect.counterparty;

                if (effect.balance) {
                    line.balance = effect.balance;
                    updateRippleBalance(effect.currency,
                        effect.counterparty,
                        effect.balance);
                }

                if (effect.deleted) {
                    delete $scope.lines[index];
                    return;
                }

                if (effect.limit) {
                    line.limit = effect.limit;
                }

                if (effect.limit_peer) {
                    line.limit_peer = effect.limit_peer;
                }

                $scope.lines[index] = $.extend($scope.lines[index], line);
            }
        });
    }

    function updateRippleBalance(currency, new_account, new_balance)
    {
        // Ensure the balances entry exists first
        if (!$scope.balances[currency]) {
            $scope.balances[currency] = {components: {}, total: null};
        }

        var balance = $scope.balances[currency];

        if (new_account) {
            balance.components[new_account] = new_balance;
        }

        $(balance.components).sort(function(a,b){
            debugger
            return a.compareTo(b);
        });

        balance.total = null;
        for (var counterparty in balance.components) {
            var amount = balance.components[counterparty];
            balance.total = balance.total ? balance.total.add(amount) : amount;
        }
    }

    var removeFirstConnectionListener =
        $scope.$on('$netConnected', handleFirstConnection);


    function handleFirstConnection() {
        // TODO: need to figure out why this isn't being set when we connect to the stellard
        $network.remote._reserve_base=50*1000000;
        $network.remote._reserve_inc=10*1000000;

        removeFirstConnectionListener();
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
