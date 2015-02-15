
angular.module('serviceMocks', [])
  .factory('session', [function() {
    var session_data = {keychainData : {updateToken: true}};
    return {get: function () {return session_data}}
  }]);
  