var api = angular.module('stellarApi');

api.service('User', function(http) {
  var User = {};

  User.changeRecoveryToken = function(params) {
    return http.post('/user/changeRecoveryToken', {username: params.username, updateToken: params.updateToken});
  };

  User.getNewRecoveryCode = function(params) {
    return http.get('/user/getNewRecoveryCode', {params: {username: params.username, updateToken: params.updateToken}});
  };

  User.getServerRecoveryCode = function(params) {
    return http.post('/user/getServerRecoveryCode', {username: params.username, updateToken: params.updateToken, userRecoveryCode: params.userRecoveryCode});
  };

  User.cancelChangingRecoveryCode = function(params) {
    return http.post('/user/cancelChangingRecoveryToken', {username: params.username, updateToken: params.updateToken});
  };

  User.finishChangeRecoveryToken = function(params) {
    return http.post('/user/finishChangeRecoveryToken', {username: params.username, updateToken: params.updateToken, userRecoveryCode: params.userRecoveryCode});
  };

  User.validateUsername = function(username) {
    return http.post('/user/validname', {username: username});
  };

  return User;
});
