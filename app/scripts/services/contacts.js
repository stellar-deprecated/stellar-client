'use strict';

var sc = angular.module('stellarClient');

sc.service('contacts', function(session, rpReverseFederation) {
  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addContact(address) {
    var wallet = session.get('wallet');
    var contacts = wallet.mainData.contacts;

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

  return {
    addContact: addContact
  }
});