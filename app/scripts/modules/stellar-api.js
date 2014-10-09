var api = angular.module('stellarAPI', []);

api.service('stellarAPI', function($http) {
  var stellarAPI = {};

  function post(path, data) {
    return $http.post(Options.API_SERVER + path, data);
  }

  function get(path, data) {
    return $http.get(Options.API_SERVER + path, data);
  }

  stellarAPI.User = {
    validateUsername: function(username) {
      return post('/user/validname', {username: username});
    }
  };

  return stellarAPI;
});