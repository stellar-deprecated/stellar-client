'use strict';

var sc = angular.module('stellarClient');

sc.service('contacts', function(rpReverseFederation) {
  var contactsByAddress;
  var contactsByFederatedName;

  // Try to load the contact list from localStorage.
  try {
    if (localStorage.stellarContactsByAddress) {
      contactsByAddress = JSON.parse(localStorage.stellarContactsByAddress);
    }
    if (localStorage.stellarContactsByFederatedName) {
      contactsByFederatedName = JSON.parse(localStorage.stellarContactsByFederatedName);
    }
  } catch(err) {
    // Unable to access localStorage.
  }

  contactsByAddress = contactsByAddress || {};
  contactsByFederatedName = contactsByFederatedName || {};

  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addContact(federatedContact) {
    federatedContect.dateCached = Date.now();
    contactsByAddress[federatedContact.destination_address] = federatedContact;

    var federatedName = federatedContact.destination + '@' + federatedContact.domain;
    contactsByFederatedName[federatedName] = federatedContact;

    // Try to save the contact list to localStorage.
    try {
      localStorage.stellarContactsByAddress = JSON.stringify(contactsByAddress);
      localStorage.stellarContactsByFederatedName = JSON.stringify(contactsByFederatedName);
    } catch(err) {
      // Unable to access localStorage.
    }
  }

  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addAddress(address) {
    if (contactsByAddress[address]) {
      // Address is already in the contact list.
      return;
    }

    rpReverseFederation.check_address(address)
      .then(function (result) {
        if (result) {
          // Add the reverse federation info to the user's wallet.
          addContact(result);
          // TODO: re-enable after we sort our load issues (and batch the sync);
          // wallet.sync("update");
        }
      })
    ;
  }

  function getContactByAddress(address) {
    return contactsByAddress[address];
  }

  function getContactByFederatedName(federatedName) {
    return contactsByFederatedName[federatedName];
  }

  return {
    addContact: addContact,
    addAddress: addAddress,
    getContactByAddress: getContactByAddress,
    getContactByFederatedName: getContactByFederatedName
  }
});