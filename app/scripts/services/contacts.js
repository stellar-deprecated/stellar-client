'use strict';

var sc = angular.module('stellarClient');

Options.MAX_CONTACT_AGE = Options.MAX_CONTACT_AGE || 24 * 60 * 60 * 1000; // One day in milliseconds.

sc.service('contacts', function($q, rpFederation, rpReverseFederation) {
  var contactsByAddress;
  var contactsByEmail;

  // Try to load the contact list from localStorage.
  try {
    if (localStorage.stellarContactsByAddress) {
      contactsByAddress = JSON.parse(localStorage.stellarContactsByAddress);
    }
    if (localStorage.stellarContactsByEmail) {
      contactsByEmail = JSON.parse(localStorage.stellarContactsByEmail);
    }
  } catch(err) {
    // Unable to access localStorage.
  }

  contactsByAddress = contactsByAddress || {};
  contactsByEmail = contactsByEmail || {};

  /**
   * If the address is not in the contact list, try to create a contact by
   * reverse federating the address.
   */
  function addContact(federatedContact) {
    federatedContact.dateCached = Date.now();
    contactsByAddress[federatedContact.destination_address] = federatedContact;

    var email = federatedContact.destination + '@' + federatedContact.domain;
    contactsByEmail[email] = federatedContact;

    // Try to save the contact list to localStorage.
    try {
      localStorage.stellarContactsByAddress = JSON.stringify(contactsByAddress);
      localStorage.stellarContactsByEmail = JSON.stringify(contactsByEmail);
    } catch(err) {
      // Unable to access localStorage.
    }

    return federatedContact;
  }

  function getContactByAddress(address) {
    return contactsByAddress[address];
  }

  function fetchContactByAddress(address) {
    var deferred = $q.defer();

    var contact = contactsByAddress[address];
    if (contact && contact.dateCached > Date.now() - Options.MAX_CONTACT_AGE) {
      deferred.resolve(contact);
    } else {
      rpReverseFederation.check_address(address)
        .then(function (result) {
          if (result) {
            // Add the reverse federation info to the user's wallet.
            contact = addContact(result);
            deferred.resolve(contact);
          }
        },
        function () {
          deferred.reject();
        })
      ;
    }

    return deferred.promise;
  }

  function fetchContactByEmail(email) {
    var deferred = $q.defer();

    var contact = contactsByEmail[email];
    if (contact && contact.dateCached < Date.now() - Options.MAX_CONTACT_AGE) {
      deferred.resolve(contact);
    } else {
      federation.check_email(email)
        .then(function (result) {
          if (result) {
            // Add the reverse federation info to the user's wallet.
            contact = addContact(result);
            deferred.resolve(contact);
          }
        },
        function () {
          deferred.reject();
        })
      ;
    }

    return deferred.promise;
  }

  return {
    addContact: addContact,
    getContactByAddress: getContactByAddress,
    fetchContactByAddress: fetchContactByAddress,
    fetchContactByEmail: fetchContactByEmail
  }
});