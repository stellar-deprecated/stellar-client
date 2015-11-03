var api = angular.module('stellarApi', []);

api.service('stellarApi', function(http, User, Upgrade) {
  var stellarApi = {};

  stellarApi.User = User;
  stellarApi.Upgrade= Upgrade;

  return stellarApi;
});
