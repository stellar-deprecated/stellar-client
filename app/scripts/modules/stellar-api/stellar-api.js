var api = angular.module('stellarApi', []);

api.service('stellarApi', function(http, User) {
  var stellarApi = {};

  stellarApi.User = User;

  return stellarApi;
});