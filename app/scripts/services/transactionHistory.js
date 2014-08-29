'use strict';

var sc = angular.module('stellarClient');

sc.service('transactionHistory', function($rootScope, $q, stNetwork, session, contacts) {
  // TODO: move history to an object, mapping hash -> transaction
  // then use an array of hashes to establish order
  var history;

  var remote;
  var account;

  var currentOffset;
  var allTransactionsLoaded;

  /**
   * Initializes the transaction history once the network is connected.
   */
  function init() {
    var deferred = $q.defer();

    function initHistory() {
      history = [];
      currentOffset = 0;
      allTransactionsLoaded = false;

      remote = stNetwork.remote;
      account = remote.account(session.get('address'));

      account.on('transaction', processNewTransaction);

      remote.once('disconnected', cleanupListeners);

      requestTransactions()
        .then(deferred.resolve);
    }

    if ($rootScope.connected) {
        initHistory();
    } else {
      $rootScope.$on('$netConnected', function() {
        initHistory();
      });
    }

    return deferred.promise;
  }

  function getPage(pageNumber) {
    // Always keep one extra page of transactions.
    var transactionsNeeded = (pageNumber + 1) * Options.transactions_per_page;

    if (!allTransactionsLoaded && history.length < transactionsNeeded) {
      return requestTransactions().then(function() {
        return getPage(pageNumber);
      });
    } else {
      var startIndex = (pageNumber - 1) * Options.transactions_per_page;
      var endIndex = pageNumber * Options.transactions_per_page;

      if (history.length <= startIndex) {
        return $q.reject();
      } else {
        var transactions = history.slice(startIndex, endIndex);
        return $q.when(transactions);
      }
    }
  }

  function lastPage() {
    if (allTransactionsLoaded) {
      return Math.ceil(history.length / Options.transactions_per_page);
    } else {
      return Infinity;
    }
  }

  /**
   * Request the first page of the transaction history.
   */
  function requestTransactions() {
    var deferred = $q.defer();

    var txRequest = remote.request_account_tx({
      'account': session.get('address'),
      'ledger_index_min': -1,
      'ledger_index_max': -1,
      'descending': true,
      'limit': Options.transactions_per_page,
      'offset': currentOffset
    });

    txRequest.on('success', function(data) {
      processTransactionSet(data);
      deferred.resolve();
    });
    txRequest.request();

    return deferred.promise;
  }

  /**
   * Process a set of transactions.
   */
  function processTransactionSet(data) {
    data.transactions = data.transactions || [];

    currentOffset += data.transactions.length;

    data.transactions.forEach(function (transaction) {
      processTransaction(transaction.tx, transaction.meta);
    });

    // Request more transactions until there are no more left.
    if (!_.any(data.transactions)) {
      allTransactionsLoaded = true;
    }
  }

  /**
   * Process new transactions as they occur.
   */
  function processNewTransaction(data) {
    currentOffset++;

    var tx = processTransaction(data.transaction, data.meta, true);

    if (tx.tx_result === "tesSUCCESS" && tx.transaction) {
      $rootScope.$broadcast('$appTxNotification', tx.transaction);
    }

    $rootScope.$broadcast('transactionHistory.historyUpdated');
  }

  /**
   * Clean up a transactions, add it to the history, and add the counterparty and issuer addresses to the contacts list.
   *
   * NOTE:  this does not, and should not do an $apply.  It gets expensive doing that on every transaction
   */
  function processTransaction(tx, meta, isNew) {
    var processedTxn = JsonRewriter.processTxn(tx, meta, session.get('address'));

    if (processedTxn) {
      var transaction = processedTxn.transaction;

      if (processedTxn.tx_type === "Payment" && processedTxn.tx_result === "tesSUCCESS" && transaction) {
        contacts.fetchContactByAddress(transaction.counterparty);
        if (transaction.amount) {
          var issuer = transaction.amount.issuer().to_json();
          if (issuer) {
            contacts.fetchContactByAddress(issuer);
          }
        }

        if (isNew) {
          history.unshift(processedTxn);
        } else {
          history.push(processedTxn);
        }
      }
    }


    return processedTxn;
  }

  /**
   * Remove any listeners that were added when the network was connected.
   */
  function cleanupListeners() {
    account.removeListener('transaction', processNewTransaction);
  }

  return {
    init: init,
    history: history,
    getPage: getPage,
    lastPage: lastPage
  };
});