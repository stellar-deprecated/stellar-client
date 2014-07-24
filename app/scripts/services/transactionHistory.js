'use strict';

var sc = angular.module('stellarClient');

sc.service('transactionHistory', function($rootScope, stNetwork, session, contacts) {
  var history = [];

  var remote;
  var account;

  /**
   * Initializes the transaction history once the network is connected.
   */
  function init() {
    $rootScope.$on('$netConnected', function() {
      // Clear the transactions history without changing the reference.
      history.length = 0;

      remote = stNetwork.remote;
      account = remote.account(session.get('address'));

      requestTransactions();
      account.on('transaction', processNewTransaction);

      remote.once('disconnected', cleanupListeners);
    });
  }

  /**
   * Request the first page of the transaction history.
   */
  function requestTransactions() {
    var txRequest = remote.request_account_tx({
      'account': session.get('address'),
      'ledger_index_min': -1,
      'ledger_index_max': -1,
      'descending': true,
      //'limit': Options.transactions_per_page,
      'offset': history.length
    });

    txRequest.on('success', processTransactionSet);
    txRequest.request();
  }

  /**
   * Process a set of transactions.
   */
  function processTransactionSet(data) {
    data.transactions = data.transactions || [];

    data.transactions.forEach(function (transaction) {
      processTransaction(transaction.tx, transaction.meta);
    });

    // Request more transactions until there are no more left.
    if (data.transactions.length) {
      requestTransactions();
    }
  }

  /**
   * Process new transactions as they occur.
   */
  function processNewTransaction(data) {
    var tx = processTransaction(data.transaction, data.meta);

    if (tx.tx_result === "tesSUCCESS" && tx.transaction) {
      $rootScope.$broadcast('$appTxNotification', tx.transaction, true);
    }
  }

  /**
   * Clean up a transactions, add it to the history, and add the addresse to the contacts list.
   */
  function processTransaction(tx, meta, isNew) {
    var processedTxn = JsonRewriter.processTxn(tx, meta, session.get('address'));

    $rootScope.$apply(function() {
      if (processedTxn) {
        var transaction = processedTxn.transaction;

        if (processedTxn.tx_type === "Payment" && processedTxn.tx_result === "tesSUCCESS" && transaction) {
          contacts.addContact(transaction.counterparty);

          if (isNew) {
            history.unshift(processedTxn);
          } else {
            history.push(processedTxn);
          }

          $rootScope.$broadcast('$paymentNotification', transaction);
        }
      }
    });

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
    history: history
  };
});