var api = angular.module('stellarApi');

api.service('Upgrade', function(http) {
  var Upgrade = {};

  Upgrade.upgrade = function(params) {
    return http.post('/upgrade/upgrade', params);
  };

  Upgrade.balance = function(params) {
    return http.get('/upgrade/balance', {params: params});
  };

  return Upgrade;
});
