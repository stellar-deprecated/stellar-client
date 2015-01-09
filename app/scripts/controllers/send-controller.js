'use strict';
/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('SendController', function($rootScope, $scope, $analytics, StellarNetwork) {
  $scope.send = {};
  // The stellar account we're sending to.
  $scope.send.destination = {};
  // The amount we're sending. An Amount object
  $scope.send.amount = null;
  // The state the send pane is in - form, confirm, or sending
  $scope.send.state = null;
  // The currencies a user can choose from. Constrained based on destination
  $scope.send.currencyChoices = _.pluck(StellarDefaultCurrencyList, 'value');
  // The currency we're sending in
  $scope.send.currency = null;
  // Status of the find path we're running
  $scope.send.pathStatus = null;
  // The paths a user has available for the current destination and amount.
  $scope.send.paths = [];
  // The path the user chooses.
  $scope.send.path = null;
  // This is our subscription to find path on the stellar network.
  $scope.send.findpath = null;
  // True if this is not a direct send (we're going through an offer).
  $scope.send.indirect = false;
  // Holds the state of our sending transaction
  $scope.send.result = null;

  $scope.setState = function (state) {
    if (!$rootScope.connected) {
      $scope.send.state = "disconnected";
      return;
    }

    if (!$rootScope.account.Balance) {
      $scope.send.state = "unfunded";
      return;
    }

    $scope.send.state = state;
  };

  // global notifications
  $scope.$on('stellar-network:connected', function(){
    if ($scope.send.state === "disconnected") {
      $scope.setState("form");
    }
  });

  $rootScope.$on('accountLoaded', function() {
    if ($scope.send.state === "unfunded") {
      $scope.setState("form");
    }
  });

  $scope.$on('payment-history:new', function(){
    if ($scope.send.state === "unfunded") {
      $scope.setState("form");
    }
  });

  $scope.$on('resetSendPane', function() {
    $scope.reset();
  });

  $scope.resetDestinationDependencies = function () {
    $scope.send.destination = {};
    $scope.send.currencyChoices = _.pluck(StellarDefaultCurrencyList, 'value');
  };

  $scope.resetCurrencyDependencies = function () {
    $scope.send.currency = {};
  };

  $scope.resetAmountDependencies = function () {
    $scope.send.amount = null;
    $scope.send.paths = [];
    $scope.send.indirect = false;
  };

  // Reset ALL the things (to make a new payment)
  $scope.reset = function () {
    $scope.setState('form');

    $scope.resetDestinationDependencies();
    $scope.resetAmountDependencies();

    $scope.$broadcast('reset');
  };

  // brings the user to the confirmation page
  $scope.sendPropose = function (path) {
    if (path) {
      $scope.send.path = path;
    }

    // close our pathfind subscription
    if ($scope.send.findpath) {
      $scope.send.findpath.close();
      delete $scope.send.findpath;
    }

    $scope.send.indirect = isPathIndirect(path);
    $scope.trackPaymentEvent("Transaction Created");
    $scope.setState('confirm');
  };

  /*
  * An indirect path is a path that uses an offer or ripple to fill the transaction.
  * An example of an INDIRECT path is a payment transaction from sender STR -> STR/USD offer -> receive USD
  * An example of a DIRECT path is a payment transaction from sender StellarGateway USD -> receive StellarGateway USD.
  * We check if the given path's path array is longer than 1 (if there's no path array or if it's of length one, it's a direct path).
  */
  function isPathIndirect(path) {
    if (path.paths && path.paths.length && path.paths[0].length > 1) {
      return true;
    }
    return false;
  }

  // bring the user back to the send form
  $scope.cancelConfirm = function () {
    $scope.setState('form');
  };

  $scope.sendConfirm = function () {
    $scope.trackPaymentEvent("Transaction Confirmed");

    var destination = $scope.send.destination;
    var amount = $scope.send.amount;

    var tx = StellarNetwork.remote.transaction();
    tx.payment($rootScope.account.Account, destination.address, amount.to_json());

    if (destination.destinationTag) {
      destination.destinationTag = parseInt(destination.destinationTag);
      tx.destination_tag(destination.destinationTag);
    }

    if ($scope.send.path) {
      tx.send_max($scope.send.path.send_max);
      tx.paths($scope.send.path.paths);
    }

    tx.on('success', function (res) {
      $scope.onTransactionSuccess(res);
    });
    tx.on('error', function (res) {
      $scope.onTransactionError(res);
    });

    tx.submit();

    $scope.setState('sending');
    $scope.send.result = "sending";
  };

  $scope.onTransactionSuccess = function (res) {
    $scope.trackPaymentEvent("Stellars Sent");

    $scope.$apply(function () {
      $scope.setEngineStatus(res, true);
    });
  };

  $scope.onTransactionError = function (res) {
    $scope.trackPaymentEvent("Transaction Failed");

    $scope.$apply(function () {
      if (res.engine_result) {
        $scope.setEngineStatus(res);
      } else if (res.error === 'remoteError') {
        $scope.send.result = "error";
        $scope.error_type = res.remote.error;
        $scope.error_message = "TODO";
      } else {
        $scope.send.result = "error";
        $scope.error_type = "unknown";
        $scope.error_message = "An unknown error occurred";
      }
    });
  };

  $scope.setEngineStatus = function (res, accepted) {
    $scope.engine_result = res.engine_result;
    $scope.engine_result_message = res.engine_result_message;
    $scope.engine_status_accepted = !!accepted;
    $scope.send.result = "status";
    $scope.tx_result = "partial";

    switch (res.engine_result.slice(0, 3)) {
    case 'tes':
      $scope.send.result = "status";
      $scope.tx_result = accepted ? "cleared" : "pending";
      break;

    case 'tep':
      $scope.send.result = "status";
      $scope.tx_result = "partial";
      break;

    case 'tec':
      $scope.send.result = "error";
      $scope.error_type = "noPath";
      $scope.send.result = "stellarerror";
      $scope.error_message = "An error occurred: " + res.engine_result_message;
      break;

    default:
      $scope.send.result = "stellarerror";
      //TODO: set an error type and unify our error reporting for the send pane
      $scope.error_message = "An error occurred: " + res.engine_result_message;
    }
  };

  $scope.trackPaymentEvent = function(eventName) {
    var destination = _.cloneDeep($scope.send.destination);
    destination.destinationTagPresent = !!destination.destinationTag;

    $analytics.eventTrack(eventName, {
      amount:      $scope.send.amount.to_human_full(),
      currency:    $scope.send.currency,
      destination: destination,
      federation:  $scope.send.destination.federatedName,
      indirect:    $scope.send.indirect,
      sendPath:    $scope.send.path.amount.to_human_full(),
    });
  };

  $scope.reset();
});
