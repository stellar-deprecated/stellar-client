var api = angular.module('stellarApi', []);

api.service('stellarApi', function(User) {
  var stellarApi = {};

  stellarApi.User = User;

  return stellarApi;
});