'use strict';

var sc = angular.module('stellarClient');

sc.controller('InvitesCtrl', function($scope, $http, $q, $filter, session, invites, singletonPromise) {

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
            text: "signed up! 500 STR sent",
            class: "success"
        },
        waiting: {
            text: "accepted but waiting for Facebook auth",
            class: "pending"
        },
        pending: {
            text: "pending",
            class: "pending"
        }
    };

    $scope.inviteActions = [
        {
            text: "copy invite link",
            include: function (invite) {
                // only include this action for invites that haven't been used yet
                return !invite.inviteeId;
            },
            action: function (invite) {

            }
        },
        {
            text: "re-send invite",
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
                    if (error.code == "time_limit") {
                        // TODO: show error 'wait a little bit before resednign'
                    }
                })
            }
        },
        {
            text: "cancel",
            include: function (invite) {
                // only include this action for invites that haven't been used yet
                return !invite.inviteeId;
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
            $scope.emailError = "Invalid email";
            return $q.reject();
        } else if (!inviteForm.email.value) {
            $scope.emailError = "Email address required";
            return $q.reject();
        }

        return invites.send($scope.inviteEmail)
            .success(function (response) {
                session.getUser().refresh();
                $scope.invites = session.getUser().getInvites();
            })
            .then(function () {
                $('#inviteForm').each(function(){
                    this.reset();
                });
            })
    });



    invites.ack()
        .then(function () {
            session.getUser().refresh();
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