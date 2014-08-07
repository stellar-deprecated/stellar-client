'use strict';

var sc = angular.module('stellarClient');

sc.controller('InvitesCtrl', function($scope, $http, $q, $filter, session, invites, singletonPromise) {

    $scope.invitesLeft = function () {
        return $filter('unsentInvitesFilter')(session.getUser().getInvites()).length;
    }

    $scope.invitesSent = function () {
        return $filter('sentInvitesFilter')(session.getUser().getInvites()).length;
    }

    // filters for invites that have been sent
    $scope.sentInviteFilter = function (invite) {
        return invite.emailedTo;
    }

    // returns a 'status' for the given invite (send, pending, facebookauth)
    $scope.getInviteStatus = function (invite) {
        if (invite.claimedAt) {
            return $scope.inviteStatus['success'];
        } else if (invite.inviteeId) {
            return $scope.inviteStatus['pending'];
        } else {
            return $scope.inviteStatus['waiting'];
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
                    $scope.getInvites();
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
                    $scope.getInvites();
                });
            }
        },
        {
            text: "send stellars to your friend",
            include: function (invite) {
                // only include if someone registered with this invite
                return invite.inviteeId;
            },
            action: function (invite) {
                // TODO: open a send pane for this invitee id
            }
        }
    ]

    $scope.getInvites = function () {
        var data = {
          username: session.get('username'),
          updateToken: session.get('wallet').keychainData.updateToken
        };
        return $http.post(Options.API_SERVER + "/users/show", data)
            .success(function (response) {
                $scope.invites = response.data.invites;
            })
            .error(function (response) {
                // TODO: show flash message error
            })
    }

    $scope.attemptSendInvite = singletonPromise(function () {
        // use angulars check value method to determine if it's a proper email
        if (!$scope.inviteEmail && inviteForm.email.value) {
            $scope.emailError = "Invalid email";
            return $q.reject();
        } else if (!inviteForm.email.value) {
            $scope.emailError = "Email address required";
            return $q.reject();
        }

        return invites.send($scope.inviteEmail)
            .success(function (response) {
                $scope.getInvites();
            })
            .then(function () {
                $('#inviteForm').each(function(){
                    this.reset();
                });
            })
    });

    $scope.getInvites();

    // TODO: dev only remove below
    $scope.getInviteCode = function () {
        var data = {
            username: session.get('username'),
            updateToken: session.get('wallet').keychainData.updateToken
        }
        $http.post(Options.API_SERVER + "/requestInvite", data)
        .success(function () {
            $scope.getInvites();
        })
    }
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