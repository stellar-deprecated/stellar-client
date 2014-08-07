angular.module('stellarClient').factory('UserPrivateInfo', function($http) {
    var UserPrivateInfo = function (username, updateToken, data) {
        this.username = username;
        this.updateToken = updateToken;
        this.invites = data.invites;
    }

    /**
    * Returns a promise that will resolve to a new UserPrivateInfo object on success.
    */
    UserPrivateInfo.load = function (username, updateToken) {
        var data = {
            username: username,
            updateToken: updateToken
        }
        return $http.post(Options.API_SERVER + "/users/show", data)
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
        return $http.post(Options.API_SERVER + "/user/show", data)
            .success(function (response) {
                self.updateUserInfo(response);
            })
    }

    UserPrivateInfo.prototype.updateUserInfo = function (showData) {
        this.invites = showData.invites;
    }

    UserPrivateInfo.prototype.getInvites = function () {
        return this.invites;
    }

    return UserPrivateInfo;
});