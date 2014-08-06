'use strict';

var sc = angular.module('stellarClient');

sc.controller('ClaimFlashMessageCtrl', function ($scope, $rootScope, $q, singletonPromise) {
  $scope.claimRewards = singletonPromise(function() {
    var deferred = $q.defer();

    $rootScope.$broadcast("claimRewards", function() {
      deferred.resolve();
    });

    return deferred.promise;
  });
});
