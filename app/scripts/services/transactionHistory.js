'use strict';

var sc = angular.module('stellarClient');

sc.service('transactionHistory', function($rootScope, stNetwork, session, rpReverseFederation) {
  $rootScope.history = [];
  var offset = 0;

  var address;
  var wallet;

  var remote;
  var account;

  /**
   * Initializes the transaction history once the network is connected.
   */
  function init() {
    $rootScope.$on('$netConnected', function() {
      // Clear the transactions history without changing the reference.
      $rootScope.history.length = 0;
      offset = 0;

      address = session.get('address');
      wallet = session.get('wallet');

      remote = stNetwork.remote;
      account = remote.account(address);

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
      'account': address,
      'ledger_index_min': -1,
      'ledger_index_max': -1,
      'descending': true,
      //'limit': Options.transactions_per_page,
      'offset': offset
    });

    txRequest.on('success', processTransactionSet);
    txRequest.request();
  }

  /**
   * Process a set of transactions.
   */
  function processTransactionSet(data) {
    data.transactions = data.transactions || [];
    offset += data.transactions.length;

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
    offset++;
    var tx = processTransaction(data.transaction, data.meta);

    if (tx.tx_result === "tesSUCCESS" && tx.transaction) {
      $rootScope.$broadcast('$appTxNotification', tx.transaction, true);
    }
  }

  /**
   * Clean up a transactions, add it to the history, and add the addresse to the contacts list.
   */
  function processTransaction(tx, meta, isNew) {
    var processedTxn = JsonRewriter.processTxn(tx, meta, address);

    $rootScope.$apply(function() {
      if (processedTxn) {
        var transaction = processedTxn.transaction;

        if (processedTxn.tx_type === "Payment" && processedTxn.tx_result === "tesSUCCESS" && transaction) {
          addContact(transaction);
          if (isNew) {
            $rootScope.history.unshift(processedTxn);
          } else {
            $rootScope.history.push(processedTxn);
          }
          $rootScope.$broadcast('$paymentNotification', transaction);
        }
      }
    });

    return processedTxn;
  }

  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addContact(transaction) {
    var contacts = wallet.mainData.contacts;
    var address = transaction.counterparty;

    if (contacts[address]) {
      // Address is already in the contact list.
      return;
    }

    rpReverseFederation.check_address(address)
      .then(function (result) {
        if (result) {
          // Add the reverse federation info to the user's wallet.
          contacts[address] = result;
          session.syncWallet(wallet, "update");
        }
      })
    ;
  }

  /**
   * Remove any listeners that were added when the network was connected.
   */
  function cleanupListeners() {
    account.removeListener('transaction', processNewTransaction);
  }

  return {
    init: init
  };
});