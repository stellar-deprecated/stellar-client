/* global $get */
/*jshint camelcase: false */

/**
 * Logs into the client with the given username or address.
 * Useful for debugging errors affecting a specific user's transactions.
 *
 * Note: Since you don't have the user's wallet key or address key, no
 * actions that require authentication with be functional.
 *
 * Example: debugAs('jared')
 */
window.debugAs = function(account) {
  var Destination = $get('Destination');
  var contacts = $get('contacts');

  if(Destination.isAddress(account)) {
    contacts.fetchContactByAddress(account)
      .then(loginAsContact)
      .catch(function() {
        return {
          destination: 'unknown',
          destination_address: account
        };
      });
  } else {
    contacts.fetchContactByEmail(account)
      .then(loginAsContact)
      .catch(function() {
        console.log('Unable to resolve username (' + account + ') to an address.');
        console.log('Try using the address instead.');
      });
  }

  function loginAsContact(contact) {
    console.log('Debugging client as ' + contact.destination + ' (' + contact.destination_address + ')');

    var Wallet  = $get('Wallet');
    var session = $get('session');
    var $state  = $get('$state');

    var wallet = new Wallet({
      version: 1,
      mainData: {
        username: contact.destination
      },
      keychainData: {
        updateToken: '',
        signingKeys: {
          address: contact.destination_address,
          secret: ''
        }
      }
    });

    // Prevent fake wallet from trying to encrypt itself.
    localStorage.rememberUser = false;
    session.login(wallet);
    $state.transitionTo('dashboard');
  }
};