sc.controller('TaskMessageCtrl', function ($rootScope, $scope, $state, $filter, session, gettextCatalog) {
    $scope.getInvitesLeft = function () {
        return $filter('unsentInviteFilter')(session.getUser().getInvites());
    };

    $scope.inviteTasks = {
        hasInviteCode: {
            getText: function () {
                return gettextCatalog.getString("Your friend sent you an invite code.");
            },
            getSubtext: function () {
                return gettextCatalog.getString("Get your bonus stellars now!");
            },
            getButtonText: function () {
                return gettextCatalog.getString("Claim stellars");
            },
            action: function () {
                $rootScope.$broadcast('openFacebookReward');
                $scope.task = null;
            }
        },
        hasNewInvites: {
            getText: function () {
                return gettextCatalog.getPlural(
                  $scope.newInvites,
                  "You have received {{newInvites}} new invite for your friends!",
                  "You have received {{newInvites}} new invites for your friends!"
                ).replace('{{newInvites}}', $scope.newInvites);
            },
            getSubtext: function () {
                return "";
            },
            getButtonText: function () {
                return gettextCatalog.getString("Send Invites");
            },
            action: function () {
                $state.transitionTo('invites');
                $scope.task = null;
            }
        }
    }

    $scope.task = null;

    function loadTasks() {
        var user = session.getUser();
        if (!user) {
            return;
        }
        if (user.getInviteCode() && !user.hasClaimedInviteCode()) {
            $scope.task = $scope.inviteTasks['hasInviteCode'];
        } else if (user.getNewInvites().length > 0) {
            $scope.newInvites = user.getNewInvites().length;
            $scope.task = $scope.inviteTasks['hasNewInvites'];
        }
    }

    $scope.$on('userLoaded', function () {
        loadTasks();
    });
});