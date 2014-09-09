var sc = angular.module('stellarClient');

sc.controller('TradingCtrl', function($scope, session, singletonPromise, Trading) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

  $scope.tradeOperation = 'buy';
  $scope.currentOrderBook = null;

  $scope.baseAmount = {
    value: 0,
    currency: $scope.currencyNames[0],
    issuer: null
  };

  $scope.unitPrice = {
    value: 0,
    currency: $scope.currencyNames[1],
    issuer: null
  };

  $scope.payableAmount = {
    value: 0,
    currency: null,
    issuer: null
  };

  $scope.$watch('baseAmount', updateForm, true);
  $scope.$watch('unitPrice', updateForm, true);

  $scope.getIssuers = function(model) {
    var currencies = _.filter($scope.currencies, {currency: model.currency});
    var issuers = _.pluck(currencies, 'issuer');
    model.issuer = issuers[0];
    return issuers;
  };

  $scope.hasIssuer = function(currencyName) {
    return currencyName && currencyName !== 'STR';
  };

  $scope.validOrderBook = function() {
    if (_.isEmpty($scope.baseAmount)) { return false; }
    if (_.isEmpty($scope.unitPrice)) { return false; }

    if ($scope.baseAmount === $scope.unitPrice) { return false; }

    return true;
  };

  $scope.createOffer = singletonPromise(function(e) {
    var offerPromise;

    if ($scope.tradeOperation === 'buy') {
      offerPromise = $scope.currentOrderBook.buy($scope.baseAmount.value, $scope.payableAmount.value);
    } else {
      offerPromise = $scope.currentOrderBook.sell($scope.baseAmount.value, $scope.payableAmount.value);
    }
    
    return offerPromise
      .catch(function(e) {
        // TODO: Handle errors.
      });
  });

  function updateForm() {
    $scope.payableAmount.value = $scope.baseAmount.value * $scope.unitPrice.value;
    $scope.payableAmount.currency = $scope.unitPrice.currency;
    $scope.payableAmount.issuer = $scope.unitPrice.issuer;

    setCurrentOrderBook();
  }

  function setCurrentOrderBook() {
    if (!$scope.validOrderBook()) { return; }

    var baseAmount = _.omit($scope.baseAmount, 'value');
    var payableAmount = _.omit($scope.payableAmount, 'value');

    // Only update the order book if it has changed.
    if ($scope.currentOrderBook) {
      var baseAmountUnchanged = _.isEqual($scope.currentOrderBook.baseAmount, baseAmount);
      var counterAmountUnchanged = _.isEqual($scope.currentOrderBook.counterAmount, payableAmount);

      if (baseAmountUnchanged && counterAmountUnchanged) { return; }

      $scope.currentOrderBook.destroy();
    }

    $scope.currentOrderBook = Trading.getOrderBook(baseAmount, payableAmount);
    $scope.currentOrderBook.subscribe();
  }
});
