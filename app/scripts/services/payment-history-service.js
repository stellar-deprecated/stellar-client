'use strict';

var sc = angular.module('stellarClient');

/**
 * The PaymentHistory provides paginated access to payment transactions.
 *
 * @namespace PaymentHistory
 */
sc.service('PaymentHistory', function($rootScope, TransactionHistory, session, contacts) {
  TransactionHistory.onTransaction(function(transaction) {
    var processedTransaction = processPaymentOnce(transaction);
    $rootScope.$broadcast('payment-history:new', processedTransaction.transaction);
  }, paymentFilter);

  /**
   * Determine if the given transaction is a payment.
   */
  function paymentFilter(transaction) {
    var address = session.get('address');

    var isSuccessful  = transaction.meta.TransactionResult === 'tesSUCCESS';
    var isPayment     = transaction.tx.TransactionType     === 'Payment';
    var isAccount     = transaction.tx.Account             === address;
    var isDestination = transaction.tx.Destination         === address;

    return isSuccessful && isPayment && (isAccount || isDestination);
  }

  /**
   * Transforms the transaction using the JsonRewriter
   * and fetches contacts for the accounts involved.
   *
   * @param {object}
   *
   * @return {object}
   */
  function processPayment(paymentTransaction) {
    var processedTxn = JsonRewriter.processTxn(paymentTransaction.tx, paymentTransaction.meta, session.get('address'));
    var transaction = processedTxn.transaction;

    contacts.fetchContactByAddress(transaction.counterparty);

    if (transaction.amount) {
      var tx = paymentTransaction.tx;

      if (tx.Amount.issuer === tx.Destination && tx.Paths) {
        // When the issuer is set to the counterparty the transaction allows using any trusted issuer.
        // Find the issuer that was used in the last currency in the path.
        var lastPath = _.last(tx.Paths[0]);
        transaction.amount.issuer().parse_json(lastPath.issuer);
      }

      var issuer = transaction.amount.issuer().to_json();
      if (issuer) {
        contacts.fetchContactByAddress(issuer);
      }
    }

    return processedTxn;
  }

  var processPaymentOnce = _.memoize(processPayment, function(paymentTransaction) {
    return paymentTransaction.tx.hash;
  });

  /**
   * Get the Nth page of payments.
   *
   * @param {Number} pageNumber
   *
   * @return {Promise.<Array>}
   */
  function getPage(pageNumber) {
    return TransactionHistory.getPage(pageNumber, paymentFilter)
      .then(function(paymentTransactions) {
        return paymentTransactions.map(processPaymentOnce);
      });
  }

  /**
   * Get the page number of the last page of payments.
   * Returns Infinity if the last page has not been determined.
   *
   * @return {Number | Infinity}
   */
  function lastPage() {
    return TransactionHistory.lastPage(paymentFilter);
  }

  return {
    getPage: getPage,
    lastPage: lastPage
  };
});