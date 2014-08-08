'use strict';

var sc = angular.module('stellarClient');

sc.service('invites', function($http, session) {

    function getParams(attrs) {
        return _.extend(attrs, {
                username: session.get('username'),
                updateToken: session.get('wallet').keychainData.updateToken
            });
    }

    return {
        send: function (email) {
            var data = getParams({email: email});

            return $http.post(Options.API_SERVER + "/invites/send", data);
        },
        cancel: function (invite) {
            var data = getParams({inviteId: invite.inviteId});

            return $http.post(Options.API_SERVER + "/invites/cancel", data);
        },
        resend: function (invite) {
            var data = getParams({inviteId: invite.inviteId});

            return $http.post(Options.API_SERVER + "/invites/resend", data);
        },
        ack: function () {
            var data = getParams({});

            return $http.post(Options.API_SERVER + "/invites/ack", data);
        }
    }
});

sc.filter('unsentInvitesFilter', function () {
    return function (invites) {
        return _.filter(invites, function (invite) {
            return !invite.emailedTo;
        })
    }
});

sc.filter('sentInvitesFilter', function () {
    return function (invites) {
        return _.filter(invites, function (invite) {
            return invite.emailedTo;
        })
    }
});

sc.filter('unseenInvitesFilter', function () {
    return function (invites) {
        return _.filter(invites, function (invite) {
            return !invite.acked;
        })
    }
})