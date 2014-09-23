'use strict';

var sc = angular.module('stellarClient');

sc.service('AccountLines', function($rootScope, StellarNetwork, session) {

  $rootScope.$on('$appTxNotification', function(e, message) {
      this.get()
        .then(function(accountLines) {
          $rootScope.$broadcast('AccountLines:update', accountLines);
        });
  });

  /**
   * Fetches account lines of the user
   * 
   * @return {Promise} 
   */
  this.get = function() {
    return StellarNetwork.request('account_lines', { 'account': session.get('address') })
      .then(function(result) {
        return result.lines;
      });
  };
});