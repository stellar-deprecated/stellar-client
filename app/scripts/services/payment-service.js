'use strict';
/* jshint camelcase: false */
/* global Amount */

var sc = angular.module('stellarClient');

sc.service('Payment', function($rootScope, $q, StellarNetwork, Destination, CancelablePromise) {

  // @namespace Payment
  var Payment = {};

  // @type {Destination}
  var destination;

  // @type {Amount}
  var amount;

  // @type {stellar.Subscription}
  var pathSubscription;

  // @type {CancelablePromise}
  var destinationPromise;

  /**
   * @return {Boolean}
   */
  Payment.isValid = function() {
    var validDestination = destination && destination.isValid();
    var validAmount = amount && amount.is_valid() && amount.is_positive();

    return validDestination && validAmount;
  };

  /**
   * Set the destination.
   *
   * @param {string} recipient The address, username, or federated address of a destination
   * @param {Number} destinationTag The destination tag of the account
   *
   * @return {CancelablePromise.<Detination>} The constructed destination object
   */
  Payment.setDestination = function(recipient, destinationTag) {
    clearPaths();

    // Cancel the old destination promise.
    if(destinationPromise) {
      destinationPromise.cancel();
      destinationPromise = null;
    }

    // Handle empty input.
    if(!recipient) {
      destination = null;
      updatePaths();
      return $q.reject('empty');
    }

    // Create a cancelable promise for this destination.
    destinationPromise = new CancelablePromise();

    // Resolve the destination for the given input.
    return destinationPromise
      .then(function() {
        $rootScope.$broadcast('payment:checking-destination');
        return Destination.get(recipient, destinationTag);
      })
      .then(function(newDestination) {
        destination = newDestination;
        updatePaths();

        return destination;
      })
      .catch(function(error) {
        if(error !== 'canceled') {
          destination = Destination.invalid();
          updatePaths();
        }

        return $q.reject(error);
      });
  };

  /**
   * Wraps the reverse federation request with the destination promise
   * so it will abort when the destination changes.
   *
   * @return {CancelablePromise.<string>}
   */
  Payment.getFederatedName = function() {
    return destinationPromise
      .then(function() {
        return destination.getFederatedName();
      });
  };

  /**
   * Set the amount.
   *
   * @param {Number} value The quantity of currency
   * @param {string} currency The type of currency
   *
   * @return {Promise.<Amount>} The constructed amount object
   */
  Payment.setAmount = function(value, currency) {
    clearPaths();

    var amountString = Number(value || 0.0).toFixed(16) + ' ' + currency;
    amount = new stellar.Amount.from_human(amountString);

    updatePaths();

    if(!value || !amount) {
      return $q.reject('empty');
    }

    if(!amount.is_positive()) {
      return $q.reject('non-positive-amount');
    }

    if(amount.is_valid()) {
      return $q.when(amount);
    }

    return $q.reject('invalid-amount');
  };

  /**
   * Cancel the path subscription and braodcast a reset event.
   */
  function clearPaths() {
    if(pathSubscription) {
      pathSubscription.closed = true; // TODO: Move to stellar-lib

      pathSubscription.close();
      pathSubscription = null;
    }

    $rootScope.$broadcast('payment:paths-reset');
  }

  /**
   * If the amount and destination are valid subscribe to payament paths
   * and broadcast path events.
   */
  function updatePaths() {
    clearPaths();

    // Determine if payment is ready to find paths.
    if(!Payment.isValid()) {
      $rootScope.$broadcast('payment:invalid');
      return;
    }

    // Determine if the amount is enough to fund the destination.
    var finalDestBalance = amount.add(destination.balance);
    if (finalDestBalance.compareTo($rootScope.account.reserve_base) < 0) {
      var minimumAmount = $rootScope.account.reserve_base.subtract(destination.balance);

      $rootScope.$broadcast('payment:destination-unfunded', minimumAmount);
      return;
    }

    if (!amount.is_native()) {
      // Use any issuer the destination trusts.
      amount.set_issuer(destination.address);
    }

    // Subscribe to path updates.
    pathSubscription = StellarNetwork.remote.path_find(
      $rootScope.account.Account,
      destination.address,
      amount
    );

    // Broadcast path updates.
    pathSubscription.on('update', function(result) {
      if(this.closed) { return; } // TODO: Move to stellar-lib

      var paths = processPaths(result.alternatives || []);
      $rootScope.$apply(broadcastPaths.call(null, paths));
    });

    // Handle path errors.
    pathSubscription.on('error', function(result) {
      if(this.closed) { return; } // TODO: Move to stellar-lib

      $rootScope.$broadcast('payment:paths-error');
    });

    // If there is a native STR path broadcast it immediately.
    var initialPaths = processPaths([]);
    if(_.any(initialPaths)) {
      broadcastPaths(initialPaths);
    } else {
      $rootScope.$broadcast('payment:paths-loading');
    }
  }

  /**
   * Broadcast an array of payment paths.
   *
   * @param {Array.<Path>} paths
   */
  function broadcastPaths(paths) {
    if(_.any(paths)) {
      // Broadcast paths.
      $rootScope.$broadcast('payment:paths', paths);
    } else {

      // No paths because of account reserve.
      var finalReserve = $rootScope.account.max_spend.subtract(amount);
      if (finalReserve.is_negative()) {
        $rootScope.$broadcast('payment:insufficient-reserve', $rootScope.account.reserve);
        return;
      }

      // No paths.
      $rootScope.$broadcast('payment:paths-empty');
    }
  }

  /**
   * Process an array of "raw" transaction paths.
   * Add a native STR path if valid.
   *
   * @param {Array.<Object>} rawPaths
   *
   * @return {Array.<Path>}
   */
  function processPaths(rawPaths) {
    var paths = _.map(rawPaths, processPath);

    // Check if we're trying to send more stellars than we have.
    var overspend = amount.is_native() &&
      $rootScope.account.max_spend &&
      $rootScope.account.max_spend.to_number() > 1 &&
      $rootScope.account.max_spend.compareTo(amount) < 0;

    if (amount.is_native() && !overspend) {
      paths.unshift({
        amount:         amount,
        amount_human:   amount.to_human(),
        currency_human: amount._currency.to_human()
      });
    }

    return paths;
  }

  /**
   * Process a "raw" transaction path.
   *
   * @param {Object} rawPath
   *
   * @return {Path}
   */
  function processPath(rawPath) {
    var path = {};
    path.amount = Amount.from_json(rawPath.source_amount);
    path.rate = path.amount.ratio_human(amount);
    path.send_max = path.amount.product_human(Amount.from_json('1.01'));
    path.currency_human = path.amount._currency.to_human();
    path.issuer_human = path.amount._issuer.to_json();
    path.paths = rawPath.paths_computed || rawPath.paths_canonical;

    // An identifier so that angular can track the elements using ng-repeat's track by
    path.issuer_currency = path.issuer_human + ',' + path.currency_human;

    return path;
  }

  return Payment;
});