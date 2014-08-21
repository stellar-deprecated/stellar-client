'use strict';

var sc = angular.module('stellarClient');

sc.controller('InvitesCtrl', function($scope, $http, $q, $filter, session, invites, singletonPromise, gettextCatalog) {
    var INVITE_LINK = "https://launch.stellar.org/#/register?inviteCode=";

    $scope.getInvites = function () {
        return session.getUser() && session.getUser().getInvites();
    }

    $scope.getUnsentInvites = function () {
        return session.getUser() && session.getUser().getUnsentInvites();
    }

    $scope.getSentInvites = function () {
        return session.getUser() && session.getUser().getSentInvites();
    }

    // returns a 'status' for the given invite (send, pending, facebookauth)
    $scope.getInviteStatus = function (invite) {
        if (invite.claimedAt) {
            return $scope.inviteStatus['success'];
        } else if (invite.inviteeId) {
            return $scope.inviteStatus['waiting'];
        } else {
            return $scope.inviteStatus['pending'];
        }
    }

    $scope.inviteStatus = {
        success: {
            text: gettextCatalog.getString("Received stellars!"),
            class: "success"
        },
        waiting: {
            text: gettextCatalog.getString("Waiting for Facebook auth"),
            class: "pending"
        },
        pending: {
            text: gettextCatalog.getString("pending"),
            class: "pending"
        }
    };

    $scope.inviteActions = [
        {
            type: "copy",
            text: gettextCatalog.getString("copy invite link"),
            include: function (invite) {
                // only include this action for invites that haven't been used yet
                return !invite.inviteeId;
            },
            action: function (invite) {
                return INVITE_LINK + invite.inviteCode;
            },
            copyAction: function (invite) {
                Util.showTooltip($('#'+invite.inviteId+" #copy-link"), gettextCatalog.getString("Copied!"),
                    'info', 'top');
            }
        },
        {
            type: "resend",
            text: gettextCatalog.getString("re-send invite"),
            include: function (invite) {
                // only include this action for invites that haven't been used yet
                return !invite.inviteeId;
            },
            action: function (invite) {
                invites.resend(invite)
                .success(function () {
                    session.getUser().refresh();
                })
                .error(function (error) {
                    Util.showTooltip($('#'+invite.inviteId+" .invite-actions"), error.message,
                        'error', 'top');
                })
            }
        },
        {
            type: "cancel",
            text: gettextCatalog.getString("cancel"),
            include: function (invite) {
                // only include this action for invites that haven't been claimed yet
                return !invite.claimedAt;
            },
            action: function (invite) {
                invites.cancel(invite)
                .success(function () {
                    session.getUser().refresh();
                });
            }
        }
    ]

    $scope.attemptSendInvite = singletonPromise(function () {
        // use angular's check value method to determine if it's a proper email
        if (!$scope.inviteEmail && inviteForm.email.value) {
            $scope.emailError = gettextCatalog.getString("Invalid email");
            return $q.reject();
        } else if (!inviteForm.email.value) {
            $scope.emailError = gettextCatalog.getString("Email address required");
            return $q.reject();
        }

        return invites.send($scope.inviteEmail)
            .success(function (response) {
                session.getUser().refresh();
                $scope.invites = session.getUser().getInvites();
            })
            .error(function (response) {
                Util.showTooltip($("#invite-email"), response.message, 'error', 'top');
            })
            .then(function () {
                $('#inviteForm').each(function(){
                    this.reset();
                });
            })
    });

    invites.ack()
        .then(function () {
            if (session.getUser()) {
                session.getUser().refresh();
            }
        });
});

sc.filter('includeInviteActionFilter', function () {
    return function (actions, invite) {
        var filtered = [];
        angular.forEach(actions, function (action) {
            if (action.include(invite)) {
                filtered.push(action);
            }
        });
        return filtered;
    }
});