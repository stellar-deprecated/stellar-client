sc.controller('TaskMessageCtrl', function ($scope, $filter, session) {
    $scope.getInvitesLeft = function () {
        return $filter('unsentInviteFilter')(session.getUser().getInvites());
    };

    $scope.inviteTasks = {
        hasInviteCode: {
            text: "Your friend sent you an invite code.",
            subtext: "Enter it and receive your remaining XXX stellars immediately.",
            buttonText: "Enter code",
            action: function () {
                // TODO: open the facebook pane
            }
        },
        hasNewInvites: {
            text: "You have received " + $scope.newInvites + " more new invites for your friends!",
            buttonText: "Share Stellar & get more stellar",
            action: function () {
                // TODO: go to invite pane
            }
        },
        receivedFirstInvites: {
            text: "Share Stellar with a friend! We will send 500 STR for every authenticated friend you invite.",
            buttonText: $scope.getInvitesLeft + " invites left",
            action: function () {
                // TODO: go to invite pane
            }
        }
    }

    $scope.task = [];

    function loadTasks() {
        var user = session.getUser();
        user.refresh()
            .then(function () {
                if (user.getInviteeCode) {
                    $scope.task = $scope.inviteTasks['hasInviteCode'];
                }
            })
    }

    $scope.$on('userLoaded', function () {
        loadTasks();
    });
});