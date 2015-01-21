'use strict';
/* jshint camelcase: false */
/* jslint bitwise:true */
/* global URI */

var sc = angular.module('stellarClient');

sc.service('Destination', function($rootScope, $q, StellarNetwork, contacts) {

  /**
   * Resolve a destination from the given input.
   *
   * @param {string} recipient
   * @param {string} destinationTag
   *
   * @return {Promise.<Destination>}
   */
  function get(recipient, destinationTag) {
    var fixedDestinationTag = false;

    // parse the dt parameter if it has one
    var destinationUri = new URI(recipient);
    var params = destinationUri.query(true);
    if (params.dt) {
      destinationTag = Number(params.dt);
      fixedDestinationTag = true;
    }

    // parse the raw address/federation name
    recipient = destinationUri.path();

    var destinationPromise;

    // Determine the input type of the recipient.
    if (isAddress(recipient)) {
      destinationPromise = getFromAddress(recipient, destinationTag);
    } else {
      destinationPromise = getFromFederatedName(recipient, destinationTag);
    }

    // Resolve the destination's account info.
    return destinationPromise
      .then(function(destination) {
        // Determine if the destination tag can be edited.
        destination.fixedDestinationTag = destination.fixedDestinationTag || fixedDestinationTag;
        return destination;
      })
      .then(getDestinationInfo)
      .then(getAcceptedCurrencies);
  }

  /**
   * Determine if the recipient is a Stellar address.
   *
   * @param {string} recipient
   *
   * @return {Boolean}
   */
  function isAddress(recipient) {
    return stellar.UInt160.is_valid(recipient);
  }

  /**
   * Construct a Destination from a Stellar address.
   *
   * @param {string} address
   * @param {string} destinationTag
   *
   * @return {Promise.<Destination>}
   */
  function getFromAddress(address, destinationTag) {
    return $q.when(new Destination({
      inputType: 'address',
      address: address,
      destinationTag: destinationTag
    }));
  }

  /**
   * Construct a Destination from a federated name.
   *
   * @param {string} federatedName
   * @param {string} destinationTag
   *
   * @return {Promise.<Destination>}
   */
  function getFromFederatedName(federatedName, destinationTag) {
    return contacts.fetchContactByEmail(federatedName)
      .then(function(result) {
        return new Destination({
          inputType: 'federatedName',
          address: result.destination_address,
          federatedName: federatedName,
          destinationTag: result.destination_tag || destinationTag,
          // Determine if the destination tag can be edited.
          fixedDestinationTag: !!result.destination_tag
        });
      });
  }

  /**
   * Add the account info to the destination.
   *
   * @param {Destination} destination
   *
   * @return {Promise.<Destination>}
   */
  function getDestinationInfo(destination) {
    return StellarNetwork.getAccount(destination.address)
      .then(function(account) {
        var accountFlags = account.Flags || 0;
        var requiresDestTagMask = stellar.Remote.flags.account_root.RequireDestTag;

        destination.requireDestinationTag = !!(accountFlags & requiresDestTagMask);
        destination.balance = account.Balance || 0;

        return destination;
      })
      .catch(function(err) {
        destination.requireDestinationTag = false;
        destination.balance = 0;

        return destination;
      });
  }

  /**
   * Add the accepted currencies to the destination.
   *
   * @param {Destination} destination
   *
   * @return {Promise.<Destination>}
   */
  function getAcceptedCurrencies(destination) {
    return StellarNetwork.request('account_currencies', {account: destination.address})
      .then(function(result) {
        destination.currencyChoices = _.uniq(result.receive_currencies || []);
        destination.currencyChoices.unshift('STR');

        return destination;
      })
      .catch(function(err) {
        destination.currencyChoices = ['STR'];

        return destination;
      });
  }

  /**
   * Add the account info to the destination.
   *
   * @param {Object} properties
   *
   * @constructor
   */
  function Destination(properties) {
    _.extend(this, properties);
  }

  /**
   * Create an invalid destination.
   *
   * @return {Destination}
   */
  function invalid() {
    return new Destination();
  }

  /**
   * Determine if the destination is valid.
   *
   * @param {Object} properties
   *
   * @constructor
   */
  Destination.prototype.isValid = function() {
    var addressPresent = !!this.address;
    var destinationTagValid = !this.requireDestinationTag || this.destinationTag;

    return addressPresent && destinationTagValid;
  };

  /**
   * Get the destination's federated name.
   *
   * @return {Promise.<string>}
   */
  Destination.prototype.getFederatedName = function() {
    if(this.federatedName) {
      return $q.when(this.federatedName);
    }

    // Reverse federate address.
    var self = this;
    return contacts.fetchContactByAddress(this.address)
      .then(function(result) {
        self.federatedName = result.destination;
        return self.federatedName;
      });
  };

  return {
    get: get,
    invalid: invalid,
    isAddress: isAddress
  };
});