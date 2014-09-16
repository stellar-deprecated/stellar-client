var sc = angular.module('stellarClient');

sc.controller('TradingCtrl', function($scope, session, singletonPromise, Trading, FlashMessages) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

  $scope.tradeOperation = 'buy';
  $scope.currentOrderBook = null;

  $scope.baseAmount = 0;
  $scope.unitPrice = 0;
  $scope.counterAmount = 0;

  $scope.baseCurrency = {
    currency: $scope.currencyNames[0],
    issuer: null
  };

  $scope.counterCurrency = {
    currency: $scope.currencyNames[1],
    issuer: null
  };

  $scope.$watch('baseCurrency', setCurrentOrderBook, true);
  $scope.$watch('counterCurrency', setCurrentOrderBook, true);

  $scope.$watch('baseAmount', calculateCounterAmount);
  $scope.$watch('unitPrice', calculateCounterAmount);

  $scope.getIssuers = function(currency) {
    var currencies = _.filter($scope.currencies, {currency: currency.currency});
    var issuers = _.pluck(currencies, 'issuer');

    currency.issuer = issuers[0];
    return issuers;
  };

  $scope.hasIssuer = function(currencyName) {
    return currencyName && currencyName !== 'STR';
  };

  $scope.createOffer = singletonPromise(function(e) {
    var offerPromise;

    if ($scope.tradeOperation === 'buy') {
      offerPromise = $scope.currentOrderBook.buy($scope.baseAmount, $scope.counterAmount);
    } else {
      offerPromise = $scope.currentOrderBook.sell($scope.baseAmount, $scope.counterAmount);
    }
    
    return offerPromise
      .then(function() {
        FlashMessages.add({
          title: 'Success!',
          info: 'The order has been successfully placed.',
          type: 'success'
        });
      })
      .catch(function(e) {
        // TODO: Handle errors.
        FlashMessages.add({
          title: 'Error occured',
          info: e.engine_result_message,
          type: 'error'
        });
      });
  });

  $scope.roundedAmount = function(value, precision) {
    return new BigNumber(value).round(precision).toString();
  };

  function calculateCounterAmount() {
    $scope.counterAmount = new BigNumber($scope.baseAmount).times($scope.unitPrice).toString();
  }

  function setCurrentOrderBook() {
    var currencyPair = currentCurrencyPair();

    if ($scope.currentOrderBook) {
      var currencyPairUnchanged = _.isEqual($scope.currentOrderBook.getCurrencyPair(), currencyPair);

      if (currencyPairUnchanged) {
        return;
      } else {
        $scope.currentOrderBook.destroy();
      }
    }

    if (currencyPair) {
      $scope.currentOrderBook = Trading.getOrderBook(currencyPair);
      $scope.currentOrderBook.subscribe();
    } else {
      $scope.currentOrderBook = null;
    }
  }

  function currentCurrencyPair() {
    if (_.isEmpty($scope.baseCurrency)) { return null; }
    if (_.isEmpty($scope.counterCurrency)) { return null; }

    var baseCurrency    = sanitizeIssuer($scope.baseCurrency);
    var counterCurrency = sanitizeIssuer($scope.counterCurrency);
    
    if (_.isEqual(baseCurrency, counterCurrency)) { return null; }

    if (!validCurrency(baseCurrency)) { return null; }
    if (!validCurrency(counterCurrency)) { return null; }


    return {
      baseCurrency:    baseCurrency,
      counterCurrency: counterCurrency
    };
  }

  function sanitizeIssuer(currency) {
    var result = _.cloneDeep(currency);

    if (!result.issuer || !$scope.hasIssuer(result.currency)) {
      delete result.issuer;
    }

    return result;
  }

  function validCurrency(currency) {
    if(typeof currency !== 'object'){ return false; }
    if(!currency.currency){ return false; }

    if($scope.hasIssuer(currency.currency) && !currency.issuer){ return false; }

    return true;
  }
});
