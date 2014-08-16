'use strict';

var sc = angular.module('stellarClient');

sc.service('rewards', function($http, session) {

    return {
        claimEmail: function (email) {
            var data = {
              username: session.get('username'),
              updateToken: wallet.keychainData.updateToken
            };
            return $http.post(Options.API_SERVER + '/claim/verifyEmail', data);
        }
    }
});