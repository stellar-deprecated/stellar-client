'use strict';

angular.module('stellarClient').controller('RippleGiveawayCtrl', function($scope, rippleGiveaway, debounce) {
  $scope.address = null;
  $scope.addressData = null;

  rippleGiveaway.getClaimData()
    .success(function(claimData) {
      $scope.claimData = claimData;
    })
    .error(function() {
      //
    });

  var getAddress = function() {
    rippleGiveaway.getAddress($scope.address)
      .success(function(response) {
        $scope.addressData = response.data;
      })
      .error(function(response) {
        switch (response.error) {
          case 'not_found':
            //
            break;
          case 'already_claimed':
            //
            break;
          default:
            //
        }
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  $scope.$watch('address', function(newVal, oldVal) {
    if (newVal === oldVal) return;
    $scope.loading = true;
    $scope.addressData = null;
    debounce(getAddress, 1000)();
  });
});
