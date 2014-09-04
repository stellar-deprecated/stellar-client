'use strict';

var sc = angular.module('stellarClient');
/*
    When we are connected to the stellard and we have our account info back from the wallet server,
    Ask the stellard for the account's info
    waits for:
     walletAddressLoaded
 */
sc.controller('AppCtrl', function($scope, $rootScope, stNetwork, session, $state, $element, $timeout, FlashMessages) {
    $rootScope.reserve=20000000;
    $rootScope.balance=null;
    $rootScope.accountStatus = 'connecting';

    var accountObj;

    $scope.$on('$netConnected', handleAccountLoad);
    $scope.$on('walletAddressLoaded', function() {
        if (stNetwork.connected) {
            handleAccountLoad();
        }
    });

    if(!session.isPersistent()) {
        $($element).click(function(){ session.act(); });
        $($element).keypress(function(){ session.act(); });
    }

    function reset()
    {
        $rootScope.balance=null;
        $rootScope.accountStatus = 'connecting';
    }

    function handleAccountLoad() {
        var remote = stNetwork.remote;
        var keys = session.get('signingKeys');
        if(!keys) {
            return;
        }

        reset();

        remote.set_secret(keys.address, keys.secret);

        accountObj = remote.account(keys.address);

        accountObj.on('entry', handleAccountEntry);
        accountObj.on('entry', setInflation);

        var listenerCleanupFn = function () {
            accountObj.off("entry", handleAccountEntry);
            accountObj.off("entry", setInflation);
        }

        remote.once('disconnected', listenerCleanupFn);

        accountObj.entry(function (err, entry) {
            $timeout(function() {
                if (err) {
                    switch(err.remote.error) {
                        case 'actNotFound':
                            // The account is unfunded.
                            $rootScope.balance = 0;
                            $rootScope.accountStatus = 'loaded';
                            break;
                        default:
                            $rootScope.accountStatus = 'error';
                    }
                } else {
                    $rootScope.accountStatus = 'loaded';
                }

            });
        });
    };

    function handleAccountEntry(data) {
        var remote = stNetwork.remote;
        $rootScope.account = data;

        // As per json wire format convention, real ledger entries are CamelCase,
        // e.g. OwnerCount, additional convenience fields are lower case, e.g.
        // reserve, max_spend.
        // TODO: get this for real
        var reserve_base = Amount.from_json(""+20000000), //Amount.from_json(""+remote._reserve_base),
            reserve_inc  = Amount.from_json(""+5000000), //Amount.from_json(""+remote._reserve_inc),
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
    }

    function setInflation(account) {
        /*
         So the fact that we now round down a users balance has this sort of bad side effect. Basically a user will get their first reward and have 5000 stellars
         after a few seconds it will suddenly change to 4999 stellars
         this is because we set the inflation dest of the account for them which takes a fee


         so as a fix, don't set the inflation destination if it will cause them to round down an STR. so basically wait till they do a send to set the inflate. this way they don't notice it. I mean right now you set the inflation_dest under certain conditions. just add this floor check as a condition also

         you can just check if floor(balance - fee) < floor(balance)

         any amount would be bad and also if they never use the giveaway. if instead their friend sends them 1000 STR or something
         */
        if (!account.InflationDest && account.InflationDest !== Options.INFLATION_DEST &&
            Math.floor(account.Balance/1000000) === Math.floor((account.Balance-20)/1000000)) {
          var tx = stNetwork.remote.transaction();
          tx = tx.accountSet(account.Account);
          tx.inflationDest(Options.INFLATION_DEST);

          tx.submit();
        }
    }

});
