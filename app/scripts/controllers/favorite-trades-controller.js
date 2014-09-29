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
    } else {
      $scope.formData.baseCurrency = _.pick($scope.currencies[0], ['issuer', 'currency']);
      $scope.formData.counterCurrency = _.pick($scope.currencies[1], ['issuer', 'currency']);
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

  $scope.currencyPairToGateway = function(currencyPair) {
    var issuer = currencyPair.baseCurrency.issuer || currencyPair.counterCurrency.issuer;
    return $scope.issuerToGateway(issuer);
  };

  $scope.currencyPairToString = function(currencyPair) {
    var gateway = $scope.currencyPairToGateway(currencyPair);

    return currencyPair.baseCurrency.currency    + '/' +
           currencyPair.counterCurrency.currency + ' ' +
           '(' + gateway + ')';
  };

  resetFavorites();
});