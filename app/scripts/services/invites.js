'use strict';

var sc = angular.module('stellarClient');

sc.service('invites', function($http, session) {

    function inviteAction(path, params) {
        params = params || {};
        _.extend(params, {
            username:    session.get('username'),
            updateToken: session.get('wallet').keychainData.updateToken
        });

        return $http.post(Options.API_SERVER + "/invites/" + path, params);
    }

    return {
        send: function (email) {
            return inviteAction('send', {email: email});
        },
        cancel: function (invite) {
            return inviteAction('cancel', {inviteId: invite.inviteId});
        },
        resend: function (invite) {
            return inviteAction('resend', {inviteId: invite.inviteId});
        },
        ack: function () {
            return inviteAction('ack');
        },
        claim: function (inviteCode) {
            return inviteAction('claim', {inviteCode: inviteCode});
        }

    };
});