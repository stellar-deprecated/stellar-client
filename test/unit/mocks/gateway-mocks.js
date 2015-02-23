'use strict';

angular.module('mockGateway', [])
//This is just a partial mock, mainly to avoid talking directly with stellartxt
  .factory('Gateways', ['$q', function($q) {
    var gateway = {
      search: function (domain) {
        var found = {
          domain: domain,
          currencies: [{currency: 'usd'}, {currency: 'cny'}]
        };
        var deferred = $q.defer();
          if (domain === 'failing-gateway') {
            deferred.reject(found);
          }
          else {
            deferred.resolve(found);
          };
        return deferred.promise;
      }, 
    };
    return gateway
  }]);
  
