'use strict';

var sc = angular.module('stellarClient');

sc.controller('ManageCurrenciesCtrl', function($rootScope, $scope, $q, session, rpStellarTxt, singletonPromise, stNetwork) {
  var mainData = session.get('wallet').mainData;
  mainData.gateways = mainData.gateways || [];
  $scope.gateways = mainData.gateways;

  $scope.currencies = [];
  $scope.gatewaySearch = '';
  $scope.gatewayDomain = '';
  $scope.searchStatus = '';

  $scope.loadCurrencies = singletonPromise(function (){
    $scope.searchStatus = 'loading';
    $scope.gatewayDomain = $scope.gatewaySearch;

    return rpStellarTxt.get($scope.gatewayDomain)
      .then(function(sections) {
        if(!sections.currencies || !sections.currencies.length) {
          $scope.currencies = [];
          $scope.searchStatus = 'no_currencies';
          return;
        }

        $scope.searchStatus = 'found';

        $scope.currencies = sections.currencies.map(function(currency) {
          var parts = currency.split(/\s+/, 2);

          return {
            currency: parts[0],
            issuer: parts[1]
          }
        });
      }, function(err) {
        $scope.currencies = [];
        $scope.searchStatus = 'not_found';
      });
  });

  $scope.resetSearch = function() {
    $scope.currencies = [];
    $scope.noResults = false;
  };

  $scope.closePane = function() {
    $rootScope.showTab = false;
    $scope.resetSearch();
  };

  $scope.addGateway = function() {
    // TODO: Remove this when limit is optional.
    var MAX_AMOUNT = '9223372036854775806';

    $scope.currencies.forEach(function(currency) {
      trustCurrency(currency, MAX_AMOUNT);
    });

    $scope.gateways.push({
      domain: $scope.gatewayDomain,
      currencies: $scope.currencies
    });
    session.syncWallet('update');
  };

  function trustCurrency(currency, limit) {
    var limit = _.extend({value: limit}, currency);

    var tx = stNetwork.remote.transaction();
    tx.trustSet(session.get('address'), limit);
    tx.submit();
  };

  $scope.removeGateway = function(index) {
    var gateway = $scope.gateways[index];
    gateway.currencies.forEach(function(currency) {
      trustCurrency(currency, '0');
    });

    $scope.gateways.splice(index, 1);
    session.syncWallet('update');
  };

  $scope.currencyNames = function(currencies) {
    return _(currencies).pluck('currency').join(', ');
  };
});