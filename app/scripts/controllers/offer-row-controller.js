var sc = angular.module('stellarClient');

sc.controller('OfferRowCtrl', function($scope, Trading, singletonPromise) {

  $scope.remove = singletonPromise(function() {
    return Trading.cancelOffer($scope.offer.sequence);
  });
});