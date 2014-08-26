'use strict';

var sc = angular.module('stellarClient');

sc.controller('ManageCurrenciesCtrl', function($rootScope, $scope, $q, session, rpStellarTxt, singletonPromise, stNetwork) {
  var mainData             = session.get('wallet').mainData;
  mainData.gateways        = mainData.gateways || {};
  mainData.pendingGateways = mainData.pendingGateways || [];
  $scope.gateways          = mainData.gateways;


  $scope.currencies = [];
  $scope.gatewaySearch = '';
  $scope.gatewayDomain = '';
  $scope.searchStatus = '';

  syncPendingGateways();

  $scope.loadCurrencies = singletonPromise(function (){
    $scope.searchStatus = 'loading';
    $scope.gatewayDomain = $scope.gatewaySearch;

    var gateway = _.find($scope.gateways, {domain: $scope.gatewayDomain});
    if(gateway) {
      $scope.searchStatus = 'already_added';
      return $q.when();
    }

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
    $scope.gatewaySearch = '';
    $scope.gatewayDomain = '';
    $scope.searchStatus = '';
  };

  $scope.closePane = function() {
    $rootScope.showTab = false;
    $scope.resetSearch();
  };

  $scope.hasGateways = function() {
    return _.any($scope.gateways);
  }

  $scope.addGateway = singletonPromise(function() {
    mainData.gateways[$scope.gatewayDomain] = _.cloneDeep({
      domain: $scope.gatewayDomain,
      currencies: $scope.currencies
    });


    mainData.pendingGateways.push($scope.gatewayDomain);
    $scope.resetSearch();
  });

  $scope.removeGateway = function(domain) {
    var currentState = $scope.gateways[domain];
    if(!currentState){ return; }
    currentState.deleted = true;

    mainData.pendingGateways.push(domain);
    syncPendingGateways();
  };

  $scope.currencyNames = function(currencies) {
    return _(currencies).pluck('currency').join(', ');
  };


  function trustCurrency(currency, value) {
    // Trust the currency for the max value by default.
    value = value || '9223372036854775806';

    var deferred = $q.defer();

    var limit = _.extend({value: value}, currency);

    var tx = stNetwork.remote.transaction();
    tx.trustSet(session.get('address'), limit);

    tx.on('success', deferred.resolve);
    tx.on('error', function(result) {
      if(result.engine_result === "tecNO_LINE_REDUNDANT") {
        deferred.resolve();
      } else {
        deferred.reject(result);
      }
    });

    tx.submit();

    return deferred.promise;
  }

  function syncPendingGateways() {
    return mainData.pendingGateways.map(syncPendingGateway);
  }

  function syncPendingGateway(domain) {
    var currentState = _.cloneDeep(mainData.gateways[domain]);
    if(!currentState) { 
      mainData.pendingGateways = _.without(mainData.pendingGateways, domain);
      return; 
    }

    var trustAmount = currentState.deleted ? '0' : '9223372036854775806';
    var truster     = function(currency) {
      return trustCurrency(currency, trustAmount);
    };

    var promises = currentState.currencies.map(truster);

    return $q.all(promises)
      .then(function() {
        mainData.pendingGateways = _.without(mainData.pendingGateways, domain);

        if(currentState.deleted) {
          delete mainData.gateways[domain];
        }
      })
      .finally(function() {
        return session.syncWallet('update');
      })
  }

});