var api = angular.module('stellarApi');

api.service('http', function($http) {
  var http = {};

  http.post = function(path, data) {
    return $http.post(Options.API_SERVER + path, data);
  };

  http.get = function(path, data) {
    return $http.get(Options.API_SERVER + path, data);
  };

  return http;
});


