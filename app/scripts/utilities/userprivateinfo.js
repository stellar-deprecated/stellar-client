angular.module('stellarClient').factory('UserPrivateInfo', function($http, $q, $filter) {
    var SHOW_ENDPOINT = Options.API_SERVER + "/users/show";

    var UserPrivateInfo = function (username, updateToken, data) {
        this.username = username;
        this.updateToken = updateToken;
        this.updateUserInfo(data);
    }

    /**
    * Returns a promise that will resolve to a new UserPrivateInfo object on success.
    */
    UserPrivateInfo.load = function (username, updateToken) {
        var data = {
            username: username,
            updateToken: updateToken
        }
        return $http.post(SHOW_ENDPOINT, data)
            .then(function (response) {
                return new UserPrivateInfo(username, updateToken, response.data.data);
            })
    }

    UserPrivateInfo.prototype.refresh = function () {
        var self = this;
        var data = {
            username: self.username,
            updateToken: self.updateToken
        }
        return $http.post(SHOW_ENDPOINT, data)
            .success(function (response) {
                return self.updateUserInfo(response.data);
            })
    }

    UserPrivateInfo.prototype.updateUserInfo = function (data) {
        this.invites = data.invites;
        this.inviteCode = data.inviteCode;
        this.claimedInviteCode = data.claimedInviteCode;
        this.inviterUsername = data.inviterUsername;
        this.email = data.email;
        return $q.resolve;
    }

    UserPrivateInfo.prototype.getInvites = function () {
        return this.invites;
    }

    UserPrivateInfo.prototype.getUnsentInvites = function () {
        return $filter('unsentInvitesFilter')(this.invites);
    }

    UserPrivateInfo.prototype.getSentInvites = function () {
        return $filter('sentInvitesFilter')(this.invites);
    }

    UserPrivateInfo.prototype.getInviteCode = function () {
        return this.inviteCode;
    }

    UserPrivateInfo.prototype.getInviterUsername = function () {
        return this.inviterUsername;
    }

    UserPrivateInfo.prototype.hasClaimedInviteCode = function () {
        return this.claimedInviteCode;
    }

    UserPrivateInfo.prototype.getNewInvites = function () {
        var invites = this.invites;
        return $filter('unseenInvitesFilter')(invites);
    }

    UserPrivateInfo.prototype.getEmailAddress = function () {
        return this.email && this.email.address;
    }

    UserPrivateInfo.prototype.isEmailVerified = function () {
        return this.email && this.email.verified;
    }

    return UserPrivateInfo;
});