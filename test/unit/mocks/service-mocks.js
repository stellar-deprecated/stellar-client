
angular.module('serviceMocks', [])
  .factory('session', [function() {
    var session_data = {keychainData : {updateToken: true}, mainData: {email: ''}};
    return {get: function () {return session_data}}
  }])
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
  