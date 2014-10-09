var api = angular.module('stellarApi', []);

api.service('stellarApi', function($http) {
  var stellarApi = {};

  function post(path, data) {
    return $http.post(Options.API_SERVER + path, data);
  }

  function get(path, data) {
    return $http.get(Options.API_SERVER + path, data);
  }

  stellarApi.User = {
    validateUsername: function(username) {
      return post('/user/validname', {username: username});
    }
  };

  return stellarApi;
});