'use strict';

angular.module('stellarClient').service('usernameHelper', function() {
  return {
    normalizeV2Username: normalizeV2Username
  };

  function normalizeV2Username(username) {
    return username.toLowerCase() + '@stellar.org';
  }
});