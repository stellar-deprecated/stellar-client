var sc = angular.module('stellarClient');

sc.controller('FavoriteTradesCtrl', function($scope, session, CurrencyPairs) {
  $scope.$watch('formData.baseCurrency', updateSelectedFavorite, true);
  $scope.$watch('formData.counterCurrency', updateSelectedFavorite, true);
  $scope.$watch('formData.favorite', useFavoriteCurrencyPair);

  $scope.$on('trading-form-controller:reset', resetFavorites);

  function resetFavorites() {
    updateFavoriteTrades();
    $scope.setFavorite(CurrencyPairs.getLastUsedFavorite());
  }

  function updateFavoriteTrades() {
    $scope.favoriteTrades = CurrencyPairs.getFavorites();
  }

  function updateSelectedFavorite() {
    if ($scope.currentOrderBook) {
      $scope.setFavorite($scope.currentOrderBook.getCurrencyPair());
    }

    $scope.resetAmounts();
  }

  function useFavoriteCurrencyPair() {
    if ($scope.formData.favorite) {
      $scope.formData.baseCurrency.currency = $scope.formData.favorite.baseCurrency.currency;
      $scope.formData.baseCurrency.issuer = $scope.formData.favorite.baseCurrency.issuer;
      $scope.formData.counterCurrency.currency = $scope.formData.favorite.counterCurrency.currency;
      $scope.formData.counterCurrency.issuer = $scope.formData.favorite.counterCurrency.issuer;
    }
  }

  $scope.setFavorite = function(currencyPair) {
    // This find operation ensures that if the current currency pair deep equals
    // one of the favorites, the dropdown uses that reference to properly update.
    // If the current currency pair is not found, the dropdown will show its placeholder.
    $scope.formData.favorite = _.find($scope.favoriteTrades, currencyPair);
  };

  $scope.addFavoritePair = function(currencyPair) {
    if ($scope.currentOrderBook) {
      CurrencyPairs.markFavorite($scope.currentOrderBook.getCurrencyPair());
      updateFavoriteTrades();
      updateSelectedFavorite();
    }
  };

  $scope.currencyPairToString = function(currencyPair) {
    var baseCurrencyGateway    = $scope.issuerToGateway(currencyPair.baseCurrency.issuer);
    var counterCurrencyGateway = $scope.issuerToGateway(currencyPair.counterCurrency.issuer);

    var twoGateways = baseCurrencyGateway && counterCurrencyGateway &&
                      baseCurrencyGateway != counterCurrencyGateway;

    if (twoGateways) {
      return currencyPair.baseCurrency.currency    + ' (' + baseCurrencyGateway    + ')' + ' / ' +
             currencyPair.counterCurrency.currency + ' (' + counterCurrencyGateway + ')';
    } else {
      return currencyPair.baseCurrency.currency    + '/' +
             currencyPair.counterCurrency.currency + ' ' +
             '(' + (baseCurrencyGateway || counterCurrencyGateway) + ')';
    }
  };

  resetFavorites();
});