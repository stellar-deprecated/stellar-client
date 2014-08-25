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
        $scope.currencies = _.map(sections.currencies, function(currency) {
          var parts = currency.split(/\s+/, 2);

          return {
            currency: parts[0],
            issuer: parts[1]
          }
        });

        $scope.searchStatus = _.any($scope.currencies) ? 'found' : 'no_currencies';
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

  $scope.addGateway = singletonPromise(function() {
    // TODO: Remove this when limit is optional.
    var MAX_AMOUNT = '9223372036854775806';

    var trustedCurrencies = [];

    // Trust each currency.
    // TODO: Replace with sequential promise utility.
    return $scope.currencies.reduce(function(promise, currency) {
      return promise.then(function() {
        return trustCurrency(currency, MAX_AMOUNT)
          .then(function() {
            // Currency trusted successfully.
            trustedCurrencies.push(currency);
          });
      });
    }, $q.when())
      .then(function() {
        // Save the gateway to the wallet.
        $scope.gateways.push({
          domain: $scope.gatewayDomain,
          currencies: $scope.currencies
        });
        session.syncWallet('update');
      })
      .catch(function(e) {
        // If any of the requests fail, remove the trusted currencies and don't save the gateway.
        trustedCurrencies.forEach(function(currency) {
          trustCurrency(currency, '0');
        });
      });
  });

  function trustCurrency(currency, limit) {
    var deferred = $q.defer();

    var limit = _.extend({value: limit}, currency);

    var tx = stNetwork.remote.transaction();
    tx.trustSet(session.get('address'), limit);

    tx.on('success', deferred.resolve);
    tx.on('error', deferred.reject);
    tx.submit();

    return deferred.promise;
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