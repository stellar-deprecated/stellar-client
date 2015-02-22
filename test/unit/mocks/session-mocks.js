'use strict';

angular.module('mockSession', [])
  .factory('session', [function() {
    var session_data = {
      keychainData : {
        updateToken: true
      }, 
      mainData: {
        email: '', 
        gateways: {
          'test-gateway': {
            domain: 'test-gateway', 
            currencies: ['usd', 'cny']
          },
          'removing-gateway': {
            domain: 'removing-gateway', 
            currencies: ['usd', 'cny'],
          }
        }
      }
    };
    return {get: function () {return session_data}, syncWallet: function () {}}
  }]);