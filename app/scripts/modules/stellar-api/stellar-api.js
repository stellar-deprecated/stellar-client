var api = angular.module('stellarApi', []);

api.service('stellarApi', function(http, User) {
  var stellarApi = {};

  stellarApi.User = User;

  stellarApi.getStatus = function() {
    return http.get(Options.API_STATUS_PATH || '/status.json');
  };

  return stellarApi;
});