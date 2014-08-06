'use strict';

var sc = angular.module('stellarClient');

sc.service('transactionHistory', function($rootScope, stNetwork, session, contacts) {
  // TODO: move history to an object, mapping hash -> transaction
  // then use an array of hashes to establish order
  var history = [];

  var remote;
  var account;

  /**
   * Initializes the transaction history once the network is connected.
   */
  function init() {
    function initHistory() {
      history = [];

      remote = stNetwork.remote;
      account = remote.account(session.get('address'));

      requestTransactions(0);
      account.on('transaction', processNewTransaction);

      remote.once('disconnected', cleanupListeners);
    }
    if ($rootScope.connected) {
        initHistory();
    } else {
      $rootScope.$on('$netConnected', function() {
        initHistory();
      });
    }
  }

  /**
   * Request the first page of the transaction history.
   */
  function requestTransactions(offset) {
    var txRequest = remote.request_account_tx({
      'account': session.get('address'),
      'ledger_index_min': -1,
      'ledger_index_max': -1,
      'descending': true,
      //'limit': Options.transactions_per_page,
      'offset': offset
    });

    txRequest.on('success', function(data) {
      processTransactionSet(offset, data);
    });
    txRequest.request();
  }

  /**
   * Process a set of transactions.
   */
  function processTransactionSet(lastOffset, data) {
    data.transactions = data.transactions || [];

    data.transactions.forEach(function (transaction) {
      processTransaction(transaction.tx, transaction.meta);
    });

    // Request more transactions until there are no more left.
    if (_.any(data.transactions)) {
      requestTransactions(lastOffset + data.transactions.length);
    }

    $rootScope.$broadcast('transactionHistory.historyUpdated', history.slice());
  }

  /**
   * Process new transactions as they occur.
   */
  function processNewTransaction(data) {

    var tx = processTransaction(data.transaction, data.meta);

    if (tx.tx_result === "tesSUCCESS" && tx.transaction) {
      $rootScope.$broadcast('$appTxNotification', tx.transaction, true);
    }

    $rootScope.$broadcast('transactionHistory.historyUpdated', history.slice());
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
        contacts.fetchContactByAddress(transaction.amount.issuer().to_json());

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
    history: history
  };
});