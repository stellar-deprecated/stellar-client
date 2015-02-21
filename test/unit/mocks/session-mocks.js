'use strict';

angular.module('mockSession', [])
  .factory('session', [function() {
    var session_data = {keychainData : {updateToken: true}, mainData: {email: ''}};
    return {get: function () {return session_data}}
  }]);