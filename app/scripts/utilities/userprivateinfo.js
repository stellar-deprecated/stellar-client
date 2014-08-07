angular.module('stellarClient').factory('UserPrivateInfo', function($http, $q) {
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
            .catch(function (error) {
                console.log(arguments);
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
        this.inviteeCode = data.inviteeCode;
        return $q.resolve;
    }

    UserPrivateInfo.prototype.getInvites = function () {
        return this.invites;
    }

    UserPrivateInfo.prototype.getInviteeCode = function () {
        return this.inviteeCode;
    }

    return UserPrivateInfo;
});