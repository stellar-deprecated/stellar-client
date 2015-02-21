'use strict';

angular.module('mockSession', [])
  .factory('session', [function() {
    var session_data = {
      keychainData : {
        updateToken: true
      }, 
      mainData: {
        email: '', 
        gateways: [
          {
            domain: 'test-gateway', 
            currencies: ['usd', 'cny']
          },
          {
            domain: 'removing-gateway', 
            currencies: ['usd', 'cny'],
            status: 'removing'
          },
        ]
      }
    };
    return {get: function () {return session_data}}
  }]);