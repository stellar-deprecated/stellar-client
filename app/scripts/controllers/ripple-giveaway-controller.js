'use strict';

angular.module('stellarClient').controller('RippleGiveawayCtrl', function($scope, rippleGiveaway, debounce) {
  $scope.address = null;
  $scope.addressData = null;
  $scope.option = 'pro_rata'; // Make this default option.

  rippleGiveaway.getClaimData()
    .success(function(claimData) {
      $scope.claimData = claimData;
    })
    .error(function(response) {
      Raven.captureMessage('Ripple Giveaway: getClaimData() error response', {
        extra: {
          response: response
        }
      });
    });

  var getAddress = function() {
    return rippleGiveaway.getAddress($scope.address)
      .success(function(response) {
        $scope.addressData = response.data;
      })
      .error(function(response) {
        if (response.error && response.error === 'not_found') {
          //
        } else {
          Raven.captureMessage('Ripple Giveaway: getAddress() error response', {
            extra: {
              response: response
            }
          });
        }
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  $scope.$watch('address', function(newVal, oldVal) {
    if (newVal === oldVal) {
      return;
    }
    $scope.loading = true;
    $scope.addressData = null;
    debounce(getAddress, 1000)();
  });

  $scope.claim = function() {
    rippleGiveaway.claim($scope.address, $scope.option)
      .success(function() {
        getAddress();
      })
      .error(function(response) {
        // TODO error message
        Raven.captureMessage('Ripple Giveaway: claim() error response', {
          extra: {
            response: response
          }
        });
      });
  };
});
