'use strict';

var sc = angular.module('stellarClient');

/**
 * The TransactionHistory provides paginated access to a filtered set of transactions.
 *
 * ### Emitted Events
 *
 * The TransactionHistory object broadcasts a series of events from the rootScope that
 * you can hook into to drive logic in your controllers:
 *
 * - `transaction-history:new`: The stellar network has added a transaction affecting
 * the current account to a ledger.
 *
 * @namespace TransactionHistory
 */
sc.service('TransactionHistory', function($rootScope, $q, StellarNetwork, session) {
  // The array of raw transactions sorted most recent first.
  var history;

  // A flag that gets set when the last transaction is encountered.
  var allTransactionsLoaded;

  // The stellar-lib Account object for the current user.
  var account;

  // The promise that is used to determine when this service is initialized.
  var ensureInitialized = StellarNetwork.ensureConnection().then(init);

  /**
   * Initialize local variables and subscribe to transaction events.
   *
   * @private
   */
  function init() {
    history = [];
    allTransactionsLoaded = false;

    account = StellarNetwork.remote.account(session.get('address'));
    account.on('transaction', function(data) {
      var transaction = {
        tx: data.transaction,
        meta: data.meta
      };

      history.unshift(transaction);

      $rootScope.$broadcast('transaction-history:new', transaction);
    });
  }

  /**
   * Subscribe to new transactions that match the given filter.
   *
   * @param {callback} callback
   * @param {function} [filter]
   */
  function onTransaction(callback, filter) {
    ensureInitialized.then(function(data) {
      account.on('transaction', function(data) {
        var transaction = {
          tx: data.transaction,
          meta: data.meta
        };

        if(filter(transaction)) {
          callback(transaction);
        }
      });
    });
  }

  /**
   * Get the Nth page of transactions that match the given filter.
   *
   * @param {Number} pageNumber
   * @param {function} [filter]
   *
   * @return {Promise.<Array>}
   */
  function getPage(pageNumber, filter) {
    return ensureInitialized.then(function() {
      // Always keep one extra page of transactions.
      var transactionsNeeded = (pageNumber + 1) * Options.TRANSACTIONS_PER_PAGE;
      var filteredHistory = filter ? _.filter(history, filter) : history;

      if (!allTransactionsLoaded && filteredHistory.length < transactionsNeeded) {
        // Request the next page of transactions.
        return requestAccountTransactions(history.length, Options.TRANSACTIONS_PER_PAGE)
          .then(function(data) {
            if (_.any(data.transactions)) {
              // Add the transactions to the history.
              history = history.concat(data.transactions);
            } else {
              // The next page was empty, so all the transactions have been loaded.
              allTransactionsLoaded = true;
            }

            // Continue building the filtered page.
            return getPage(pageNumber, filter);
          });
      } else {
        var startIndex = (pageNumber - 1) * Options.TRANSACTIONS_PER_PAGE;
        var endIndex = pageNumber * Options.TRANSACTIONS_PER_PAGE;

        if (filteredHistory.length <= startIndex) {
          // Not enough transactions pass the filter to reach the requested page.
          return $q.reject();
        } else {
          // Resolve the requested page from the filtered history.
          var transactions = filteredHistory.slice(startIndex, endIndex);
          return $q.when(transactions);
        }
      }
    });
  }

  /**
   * Request a set of transactions for the current account.
   *
   * @return {Promise}
   */
  function requestAccountTransactions(startIndex, count) {
    return StellarNetwork.request('account_tx', {
      'account': session.get('address'),
      'ledger_index_min': -1,
      'ledger_index_max': -1,
      'descending': true,
      'limit': count,
      'offset': startIndex,
    });
  }

  /**
   * Get the page number of the last page of transactions that matches the given filter.
   * Returns Infinity if the last page has not been determined.
   *
   * @param {function} [filter]
   *
   * @return {Number | Infinity}
   */
  function lastPage(filter) {
    if (allTransactionsLoaded) {
      var filteredHistory = filter ? _.filter(history, filter) : history;
      return Math.ceil(filteredHistory.length / Options.TRANSACTIONS_PER_PAGE);
    } else {
      return Infinity;
    }
  }

  return {
    getPage: getPage,
    lastPage: lastPage,
    onTransaction: onTransaction
  };
});