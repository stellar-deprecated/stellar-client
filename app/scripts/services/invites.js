'use strict';

var sc = angular.module('stellarClient');

sc.service('invites', function($http, session) {
    var data = {
        username: session.get('username'),
        updateToken: session.get('wallet').keychainData.updateToken
    };
    return {
        send: function (email) {
            data.email = email;

            return $http.post(Options.API_SERVER + "/invites/send", data);
        },
        cancel: function (invite) {
            data.inviteId = invite.inviteId;

            return $http.post(Options.API_SERVER + "/invites/cancel", data);
        }
    }
});