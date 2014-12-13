'use strict';
/* jshint camelcase: false */

var sc = angular.module('stellarClient');

sc.service('BitcoinBridge', function($q, StellarNetwork, rpStellarTxt) {
  /**
   * Determine if the recipient is a Bitcoin address.
   *
   * @param {string} recipient
   *
   * @return {Boolean}
   */
  function isBitcoinAddress(recipient) {
    var bytes = stellar.Base.decode_check([0, 5], recipient, 'bitcoin');
    return !isNaN(bytes);
  }

  /**
   * Construct a BitcoinBridge from a Bitcoin address.
   *
   * @param {string} address
   * @param {string} destinationTag
   *
   * @return {Promise.<BitcoinBridge>}
   */
  function get(bitcoinAddress) {
    if(!isBitcoinAddress(bitcoinAddress)) {
      return $q.reject('Invalid bitcoin address!');
    }

    return rpStellarTxt.get(Options.DEFAULT_BITCOIN_BRIDGE)
      .then(function(txt) {
        if(!txt.quote_url) {
          return $q.reject('Unable to find bitcoin bridge!');
        }

        return new BitcoinBridge(bitcoinAddress, txt.quote_url);
      });
  }

  /**
   * Add the bitcoin bridge account info to the destination.
   *
   * @param {String} bitcoinAddress
   * @param {String} quoteUrl
   *
   * @constructor
   */
  function BitcoinBridge(bitcoinAddress, quoteUrl) {
    this.inputType = 'bitcoinAddress';
    this.bitcoinAddress = bitcoinAddress;
    this.quoteUrl = quoteUrl;
  }

  /**
   * Create an invalid destination.
   *
   * @return {BitcoinBridge}
   */
  function invalid() {
    return new BitcoinBridge();
  }

  /**
   * Determine if the bitcoin bridge destination is valid.
   *
   * @param {Object} properties
   *
   * @constructor
   */
  BitcoinBridge.prototype.isValid = function() {
    var addressPresent = !!this.bridgeAddress;
    var quoteUrlPresent = !!this.quoteUrl;

    return addressPresent && quoteUrlPresent;
  };

  return {
    isBitcoinAddress: isBitcoinAddress,
    get: get,
    invalid: invalid
  };
});