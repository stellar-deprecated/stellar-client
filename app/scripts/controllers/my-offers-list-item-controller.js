var sc = angular.module('stellarClient');

sc.controller('MyOffersListItemCtrl', function($scope, Trading) {

  $scope.remove = function() {    
    Trading
      .cancelOffer($scope.offer.seq)
      .catch(function (e) {
        //TODO: actually show an error
        console.log(e);
      })
      .finally(function () {
        $scope.refreshMyOffers();
      });
  };


});
