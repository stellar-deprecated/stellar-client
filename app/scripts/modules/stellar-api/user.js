var api = angular.module('stellarApi');

api.service('User', function(http) {
  var User = {};
  
  User.validateUsername = function(username) {
    return http.post('/user/validname', {username: username});
  };

  return User;
});
