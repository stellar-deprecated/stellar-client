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

  retryUnfinishedGateways();

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
    var trustedCurrencies = [];
    var failedCurrencies = [];

    // Trust each currency.
    var promises = $scope.currencies.map(function(currency) {
      return trustCurrency(currency)
        .then(function() {
          trustedCurrencies.push(currency);
        })
        .catch(function() {
          failedCurrencies.push(currency);
        });
    });

    // Save the gateway to the wallet once the currencies have been trusted.
    return $q.all(promises)
      .finally(function() {
        if(_.any(trustedCurrencies)) {
          $scope.gateways.push({
            domain: $scope.gatewayDomain,
            currencies: trustedCurrencies,
            failedCurrencies: failedCurrencies
          });
          session.syncWallet('update');
        } else {
          // Unable to add the gateway's currencies.
        }
      });
  });

  function retryUnfinishedGateways() {
    $scope.gateways.forEach(function(gateway) {
      if(!_.any(gateway.failedCurrencies)) return;

      var trustedCurrencies = [];
      var failedCurrencies = [];

      // Retry trusting each failed currency.
      var promises = gateway.failedCurrencies.map(function(currency) {
        return trustCurrency(currency)
          .then(function() {
            trustedCurrencies.push(currency);
          })
          .catch(function() {
            failedCurrencies.push(currency);
          });
      });

      // Update the wallet with the new currencies.
      $q.all(promises)
        .finally(function() {
          if(_.any(trustedCurrencies)) {
            gateways.currencies.concat(trustedCurrencies);
            gateways.failedCurrencies = failedCurrencies;
            session.syncWallet('update');
          }
        });
    });
  }

  function trustCurrency(currency, value) {
    // Trust the currency for the max value by default.
    value = value || '9223372036854775806';

    var deferred = $q.defer();

    var limit = _.extend({value: value}, currency);

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