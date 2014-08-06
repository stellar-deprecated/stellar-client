'use strict';

var sc = angular.module('stellarClient');

sc.service('contacts', function(rpReverseFederation) {
  var contactsByAddress = {};
  var contactsByFederatedName = {};

  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addContact(federatedContact) {
    contactsByAddress[federatedContact.destination_address] = federatedContact;

    var federatedName = federatedContact.destination + '@' + federatedContact.domain;
    contactsByFederatedName[federatedName] = federatedContact;
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