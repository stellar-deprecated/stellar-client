'use strict';

angular.module('mockGateway', [])
  .factory('Gateways', ['$q', function($q) {
    var gateway = {
      search: function (domain) {
        var found = {
          domain: domain,
          currencies: ['usd', 'cny']
        };
        var deferred = $q.defer();
        setTimeout(function() {
          if (domain === 'failing-gateway') {
            deferred.reject(found);
          }
          else {
             deferred.resolve(found);
          };
        }, 10);
        return deferred.promise;
      }, 
    };
    return gateway
  }]);
  