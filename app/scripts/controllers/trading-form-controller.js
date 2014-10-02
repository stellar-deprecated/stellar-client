var sc = angular.module('stellarClient');

sc.controller('TradingFormCtrl', function($scope, session, singletonPromise, FlashMessages) {
  // Populate the currency lists from the wallet's gateways.
  var gateways = session.get('wallet').get('mainData', 'gateways', []);
  var gatewayCurrencies = _.flatten(_.pluck(gateways, 'currencies'));
  $scope.currencies = [{currency:"STR"}].concat(gatewayCurrencies);
  $scope.currencyNames = _.uniq(_.pluck($scope.currencies, 'currency'));

  $scope.$watch('formData.baseAmount', calculateCounterAmount);
  $scope.$watch('formData.unitPrice', calculateCounterAmount);

  $scope.changeBaseCurrency = function(newCurrency) {
    $scope.formData.baseCurrency = {
      currency: newCurrency,
      issuer: $scope.getIssuers(newCurrency)[0]
    };
  };

  $scope.changeCounterCurrency = function(newCurrency) {
    $scope.formData.counterCurrency = {
      currency: newCurrency,
      issuer: $scope.getIssuers(newCurrency)[0]
    };
  };

  function calculateCounterAmount() {
    $scope.formData.counterAmount = new BigNumber($scope.formData.baseAmount).times($scope.formData.unitPrice).toString();
  }

  $scope.getIssuers = function(currency) {
    var currencies = _.filter($scope.currencies, {currency: currency});
    var issuers = _.pluck(currencies, 'issuer');

    return issuers;
  };

  $scope.setBaseIssuer = function(issuer) {
    $scope.formData.baseCurrency.issuer = issuer;
  };

  $scope.setCounterIssuer = function(issuer) {
    $scope.formData.counterCurrency.issuer = issuer;
  };

  $scope.confirmOffer = function() {
    $scope.state = 'confirm';
  };

  $scope.editForm = function() {
    $scope.state = 'form';
  };

  $scope.resetForm = function() {
    $scope.state = 'form';
    $scope.formData.tradeOperation = 'buy';

    $scope.clearForm();

    $scope.$broadcast('trading-form-controller:reset');
  };

  $scope.clearForm = function() {
    $scope.resetAmounts();

    $scope.formData.baseCurrency = {
      currency: null,
      issuer: null
    };

    $scope.formData.counterCurrency = {
      currency: null,
      issuer: null
    };

    $scope.formData.favorite = null;
    $scope.offerError = '';
  };

  $scope.resetAmounts = function() {
    $scope.formData.baseAmount = null;
    $scope.formData.unitPrice = null;
    $scope.formData.counterAmount = null;
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
        if($scope.state === 'sending') {
          $scope.state = 'sent';
        } else {
          FlashMessages.add({
            title: 'Success!',
            info: 'Offer created.',
            type: 'success'
          });
        }
      })
      .catch(function(e) {
        if($scope.state === 'sending') {
          $scope.state = 'error';
          $scope.offerError = e.engine_result_message;
        } else {
          FlashMessages.add({
            title: 'Unable to create offer!',
            info: e.engine_result_message,
            type: 'error'
          });
        }
      });
  });
});