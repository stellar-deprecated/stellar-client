var sc = angular.module('stellarClient');

sc.controller('TradingFormCtrl', function($scope, session, singletonPromise, FlashMessages) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

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

  $scope.createOffer = singletonPromise(function(e) {
    var offerPromise;

    if ($scope.formData.tradeOperation === 'buy') {
      offerPromise = $scope.currentOrderBook.buy($scope.formData.baseAmount, $scope.formData.counterAmount);
    } else {
      offerPromise = $scope.currentOrderBook.sell($scope.formData.baseAmount, $scope.formData.counterAmount);
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
});