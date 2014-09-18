var sc = angular.module('stellarClient');

sc.controller('TradingFormCtrl', function($scope, session, singletonPromise, FlashMessages) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

  $scope.$watch('formData.baseAmount', calculateCounterAmount);
  $scope.$watch('formData.unitPrice', calculateCounterAmount);

  function calculateCounterAmount() {
    $scope.formData.counterAmount = new BigNumber($scope.formData.baseAmount).times($scope.formData.unitPrice).toString();
  }

  $scope.getIssuers = function(currency) {
    var currencies = _.filter($scope.currencies, {currency: currency.currency});
    var issuers = _.pluck(currencies, 'issuer');

    currency.issuer = issuers[0];
    return issuers;
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
    
    return offerPromise
      .then(function() {
        $scope.state = 'sent';
      })
      .catch(function(e) {
        $scope.state = 'error';
        $scope.offerError = e.engine_result_message;
      });
  });
});