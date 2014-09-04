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
    };

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
  }

  function handleAccountEntry(data) {
    // var remote = stNetwork.remote;
    $rootScope.account = data;

    // As per json wire format convention, real ledger entries are CamelCase,
    // e.g. OwnerCount, additional convenience fields are lower case, e.g.
    // reserve, max_spend.
    // TODO: get this for real
    var reserveBase = stellar.Amount.from_json(""+20000000); //Amount.from_json(""+remote._reserve_base),
    var reserveInc  = stellar.Amount.from_json(""+5000000); //Amount.from_json(""+remote._reserve_inc),
    var ownerCount  = $rootScope.account.OwnerCount || "0";

    $rootScope.account.reserve_base = reserveBase;
    $rootScope.account.reserve = reserveBase.add(reserveInc.product_human(ownerCount));
    $rootScope.account.reserve_to_add_trust = reserveBase.add(reserveInc.product_human(ownerCount+1));

    // Maximum amount user can spend
    var bal = stellar.Amount.from_json(data.Balance);
    $rootScope.balance = data.Balance;
    $rootScope.reserve = $rootScope.account.reserve;
    $rootScope.account.max_spend = bal.subtract($rootScope.account.reserve);
    $rootScope.$broadcast("accountLoaded", $rootScope.account);
  }

  function setInflation(account) {
    // Only set the inflation destination if it is not already set
    // and it won't cause the floorded balance to change.
    var feeChangesBalance = Math.floor(account.Balance/1000000) !== Math.floor((account.Balance-20)/1000000);

    if (!account.InflationDest && Options.INFLATION_DEST && !feeChangesBalance) {
      var tx = stNetwork.remote.transaction();
      tx = tx.accountSet(account.Account);
      tx.inflationDest(Options.INFLATION_DEST);

      tx.submit();
    }
  }

});
