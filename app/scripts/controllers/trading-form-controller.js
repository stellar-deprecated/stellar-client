var sc = angular.module('stellarClient');

sc.controller('TradingFormCtrl', function($scope, session, singletonPromise, FlashMessages, CurrencyPairs) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

  $scope.favoriteTrades = CurrencyPairs.getFavorites();

  $scope.$watch('formData.baseCurrency', updateSelectedFavorite, true);
  $scope.$watch('formData.counterCurrency', updateSelectedFavorite, true);
  $scope.$watch('formData.baseAmount', calculateCounterAmount);
  $scope.$watch('formData.unitPrice', calculateCounterAmount);
  $scope.$watch('formData.favorite', useFavoriteCurrencyPair);

  $scope.changeBaseCurrency = function(newCurrency) {
    $scope.formData.baseCurrency.currency = newCurrency;
  };

  $scope.changeCounterCurrency = function(newCurrency) {
    $scope.formData.counterCurrency.currency = newCurrency;
  };

  function setFavorite(currencyPair) {
    // This find operation ensures that if the current currency pair deep equals
    // one of the favorites, the dropdown uses that reference to properly update.
    // If the current currency pair is not found, the dropdown will show its placeholder.
    $scope.formData.favorite = _.find($scope.favoriteTrades, currencyPair);
  }

  function updateSelectedFavorite() {
    if ($scope.currentOrderBook) {
      setFavorite($scope.currentOrderBook.getCurrencyPair());
    }
  }

  function calculateCounterAmount() {
    $scope.formData.counterAmount = new BigNumber($scope.formData.baseAmount).times($scope.formData.unitPrice).toString();
  }

  function useFavoriteCurrencyPair() {
    if ($scope.formData.favorite) {
      $scope.formData.baseCurrency.currency = $scope.formData.favorite.baseCurrency.currency;
      $scope.formData.baseCurrency.issuer = $scope.formData.favorite.baseCurrency.issuer;
      $scope.formData.counterCurrency.currency = $scope.formData.favorite.counterCurrency.currency;
      $scope.formData.counterCurrency.issuer = $scope.formData.favorite.counterCurrency.issuer;
    }
  }

  $scope.getIssuers = function(currency) {
    var currencies = _.filter($scope.currencies, {currency: currency.currency});
    var issuers = _.pluck(currencies, 'issuer');

    currency.issuer = issuers[0];
    return issuers;
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

  $scope.issuerToGateway = function(issuer) {
    var gateway = _.find(gateways, function(gateway) {
      return !!_.find(gateway.currencies, {issuer: issuer});
    });

    if(gateway) {
      return gateway.domain;
    }
  };

  $scope.confirmOffer = function() {
    $scope.state = 'confirm';
  };

  $scope.editForm = function() {
    $scope.state = 'form';
  };

  $scope.resetForm = function() {
    $scope.formData.tradeOperation = 'buy';
    $scope.formData.baseAmount = '0';
    $scope.formData.unitPrice = '0';
    $scope.formData.counterAmount = '0';

    setFavorite(CurrencyPairs.getLastUsedFavorite());

    $scope.formData.baseCurrency = {
      currency: $scope.currencyNames[0],
      issuer: null
    };

    $scope.formData.counterCurrency = {
      currency: $scope.currencyNames[1],
      issuer: null
    };

    $scope.state = 'form';
    $scope.offerError = '';
  };

  $scope.resetForm();

  $scope.formIsValid = function() {
    if (!$scope.currentOrderBook) { return false; }

    try {
      if (new BigNumber($scope.formData.baseAmount).lessThanOrEqualTo(0)) { return false; }
      if (new BigNumber($scope.formData.unitPrice).lessThanOrEqualTo(0)) { return false; }
      if (new BigNumber($scope.formData.counterAmount).lessThanOrEqualTo(0)) { return false; }
    } catch(e) {
      // Invalid input.
      return false;
    }

    return true;
  };

  $scope.createOffer = singletonPromise(function(e) {
    var offerPromise;

    if ($scope.formData.tradeOperation === 'buy') {
      offerPromise = $scope.currentOrderBook.buy($scope.formData.baseAmount, $scope.formData.counterAmount);
    } else {
      offerPromise = $scope.currentOrderBook.sell($scope.formData.baseAmount, $scope.formData.counterAmount);
    }

    $scope.state = 'sending';
    var currencyPair = $scope.currentOrderBook.getCurrencyPair();
    
    return offerPromise
      .then(function() {
        $scope.state = 'sent';

        CurrencyPairs.markFavorite(currencyPair);
        session.syncWallet('update');

        $scope.favoriteTrades = CurrencyPairs.getFavorites();
      })
      .catch(function(e) {
        $scope.state = 'error';
        $scope.offerError = e.engine_result_message;
      });
  });
});