var sc = angular.module('stellarClient');

sc.controller('TradingCtrl', function($scope, $q, Trading, Gateways, singletonPromise) {
  $scope.currentOrderBook = null;
  $scope.precision        = 5;

  $scope.formData = {};

  $scope.roundedAmount = function(value, precision) {
    return new BigNumber(value).round(precision).toString();
  };

  $scope.hasIssuer = function(currencyName) {
    return currencyName && currencyName !== 'STR';
  };

  $scope.issuerToGateway = function(issuer) {
    var gateway = Gateways.findByIssuer(issuer);

    if(gateway) {
      return gateway.domain;
    }
  };

  $scope.currencyPairToString = function(currencyPair) {
    var baseCurrencyGateway    = $scope.issuerToGateway(currencyPair.baseCurrency.issuer);
    var counterCurrencyGateway = $scope.issuerToGateway(currencyPair.counterCurrency.issuer);

    var twoGateways = baseCurrencyGateway && counterCurrencyGateway &&
                      baseCurrencyGateway !== counterCurrencyGateway;

    if (twoGateways) {
      return currencyPair.baseCurrency.currency    + ' (' + baseCurrencyGateway    + ')' + ' / ' +
             currencyPair.counterCurrency.currency + ' (' + counterCurrencyGateway + ')';
    } else {
      return currencyPair.baseCurrency.currency    + '/' +
             currencyPair.counterCurrency.currency + ' ' +
             '(' + (baseCurrencyGateway || counterCurrencyGateway) + ')';
    }
  };

  $scope.setCurrentOrderBook = singletonPromise(function() {
    var currencyPair = currentCurrencyPair();

    if ($scope.currentOrderBook) {
      var currencyPairUnchanged = _.isEqual($scope.currentOrderBook.getCurrencyPair(), currencyPair);

      if (currencyPairUnchanged) {
        return $q.when();
      } else {
        $scope.currentOrderBook.destroy();
      }
    }

    if (currencyPair) {
      $scope.currentOrderBook = Trading.getOrderBook(currencyPair);
      return $scope.currentOrderBook.subscribe();
    } else {
      $scope.currentOrderBook = null;
      return $q.when();
    }
  });

  $scope.$watch('formData.baseCurrency', $scope.setCurrentOrderBook, true);
  $scope.$watch('formData.counterCurrency', $scope.setCurrentOrderBook, true);

  function currentCurrencyPair() {
    if (_.isEmpty($scope.formData.baseCurrency)) { return null; }
    if (_.isEmpty($scope.formData.counterCurrency)) { return null; }

    var baseCurrency    = sanitizeIssuer($scope.formData.baseCurrency);
    var counterCurrency = sanitizeIssuer($scope.formData.counterCurrency);
    
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
