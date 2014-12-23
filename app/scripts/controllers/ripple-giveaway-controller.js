'use strict';

angular.module('stellarClient').controller('RippleGiveawayCtrl', function($scope, rippleGiveaway) {
  $scope.address = null;
  $scope.addressData = null;
  $scope.error = null;
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

  var getAddress = function(address) {
    $scope.error = null;
    return rippleGiveaway.getAddress(address)
      .success(function(response) {
        $scope.addressData = response.data;
      })
      .error(function(response) {
        if (response.error && response.error === 'not_found') {
          $scope.error = 'This Ripple address is ineligible.';
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

  $scope.nextStep = function($event) {
    /* jshint camelcase:false */
    $event.preventDefault();
    var previousStatus = $scope.addressData.status;
    getAddress($scope.addressData.ripple_address)
      .then(function() {
        if (previousStatus === $scope.addressData.status) {
          switch (previousStatus) {
            case 'not_associated':
              $scope.error = 'We haven\'t processed your payment yet. Please try again in a few minutes.';
              break;
            case 'donation':
              $scope.error = 'We haven\'t processed your donation yet. Please try again in a few minutes.';
              break;
          }
        }
      });
  };

  $scope.getAddress = function($event) {
    $event.preventDefault();
    $scope.loading = true;
    $scope.addressData = null;
    getAddress($scope.address);
  };

  $scope.claim = function($event) {
    $event.preventDefault();
    rippleGiveaway.claim($scope.address, $scope.option)
      .success(function() {
        /* jshint camelcase:false */
        getAddress($scope.addressData.ripple_address);
      })
      .error(function(response) {
        $scope.error = 'Error. Please try again later.';
        Raven.captureMessage('Ripple Giveaway: claim() error response', {
          extra: {
            response: response
          }
        });
      });
  };
});
