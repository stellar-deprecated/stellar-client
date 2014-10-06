var sc = angular.module('stellarClient');

sc.controller('CurrentOffersCtrl', function($scope, Trading) {
  $scope.myOffers = [];

  $scope.refreshMyOffers = function() {
    Trading.myOffers().then(function (offers) {
      $scope.myOffers = _.isEmpty(offers) ? [] : offers.map(Trading.offer.toFriendlyOffer);
    });
  };

  function handleOfferCreated(event, offer) {
    $scope.myOffers.push(Trading.offer.toFriendlyOffer(offer));
  }

  function handleOfferChanged(event, offer) {
    var existingOffer = _.find($scope.myOffers, {sequence: offer.sequence});
    if (existingOffer) {
      _.assign(existingOffer, Trading.offer.toFriendlyOffer(offer));
    }
  }

  function handleOfferRemoved(event, offer) {
    $scope.myOffers = _.reject($scope.myOffers, {sequence: offer.sequence});
  }

  $scope.$on('trading:my-offers:created-unfilled', handleOfferCreated);
  $scope.$on('trading:my-offers:created-filled', handleOfferCreated);
  $scope.$on('trading:my-offers:created-partially-filled', handleOfferCreated);

  $scope.$on('trading:my-offers:partially-filled', handleOfferChanged);

  $scope.$on('trading:my-offers:filled', handleOfferRemoved);
  $scope.$on('trading:my-offers:canceled', handleOfferRemoved);

  $scope.refreshMyOffers();
});