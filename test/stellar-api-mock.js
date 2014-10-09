exports.setup = function() {
  var api = angular.module('stellarAPI', []);

  api.service('HttpMock', function($q) {
    var HttpMock = function(promise) {
      this.promise = promise;
    };

    HttpMock.prototype.success = function(callback) {
      return new HttpMock(this.promise.then(callback));
    };

    HttpMock.prototype.error = function(callback) {
      return new HttpMock(this.promise.catch(callback));
    };

    HttpMock.success = function(response) {
      return new HttpMock($q.when(response));
    };

    HttpMock.error = function(response) {
      return new HttpMock($q.reject(response));
    };

    return HttpMock;
  });

  api.service('stellarAPI', function(HttpMock) {
    var stellarAPI = {};

    stellarAPI.User = {
      validateUsername: function(username) {
        switch(username) {
          case 'existingUsername': return HttpMock.error({code: 'already_taken'});
          case 'newUsername':      return HttpMock.success({status: 'success'});
        }

        throw new Error('Unexpected username passed to stellarAPI.User.validateUsername: ' + username);
      }
    };

    return stellarAPI;
  });
};