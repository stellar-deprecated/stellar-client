var sc = angular.module('stellarClient');

sc.controller('TradingCtrl', function($scope, Trading) {
  $scope.currentOrderBook = null;

  $scope.formData = {};

  $scope.$watch('formData.baseCurrency', setCurrentOrderBook, true);
  $scope.$watch('formData.counterCurrency', setCurrentOrderBook, true);

  $scope.roundedAmount = function(value, precision) {
    return new BigNumber(value).round(precision).toString();
  };

  $scope.hasIssuer = function(currencyName) {
    return currencyName && currencyName !== 'STR';
  };

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
