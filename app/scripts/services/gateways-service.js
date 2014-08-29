var sc = angular.module('stellarClient');

sc.service('Gateways', function($q, session, stNetwork, rpStellarTxt) {

  /** @namespace */
  var Gateways = {};

  Gateways.search = function(domain) {
    return rpStellarTxt.get(domain)
      .then(function(sections) {
          var currencies = _.map(sections.currencies, function(currency) {
            var parts = currency.split(/\s+/, 2);

            return {
              currency: parts[0],
              issuer: parts[1]
            };
          });

          return {
            domain: domain,
            currencies: currencies
          };
      });
  };

  Gateways.add = function(gateway) {
    walletGateways()[gateway.domain]        = _.cloneDeep(gateway);
    walletGateways()[gateway.domain].status = "adding";
    return Gateways.syncTrustlines(gateway.domain).then(function() {
      if(gateway.status === "added") {
        return gateway;
      } else {
        return $q.reject(new Error("Failed to add " + gateway.domain));
      }
    });
  };

  Gateways.remove = function(gateway) {
    gateway.status = "removing";
    return Gateways.syncTrustlines(gateway.domain).then(function() {
      if(!_.has(walletGateways(), gateway.domain)) {
        return gateway;
      } else {
        return $q.reject(new Error("Failed to remove " + gateway.domain));
      }
    });
  };

  Gateways.forceRemove = function(gateway) {
     delete walletGateways()[gateway.domain];
     return session.syncWallet('update');
  };

  Gateways.syncTrustlines = function() {
    //TODO: obey domain restriction arguments    
    
    var domainsToRemove = domainsWithStatus("removing");
    var domainsToAdd    = domainsWithStatus("adding");

    var needSync = _.any(domainsToRemove) || _.any(domainsToAdd);

    if(!needSync){ return; }

    
    var removalPromises = domainsToRemove.map(removeGateway);
    var addPromises     = domainsToAdd.map(addGateway);
    var allPromises     = removalPromises.concat(addPromises);
    
    return $q.all(allPromises)
      .then(function () { return session.syncWallet('update'); });
  };

  function removeGateway(gateway) {
    return $q.all(gateway.currencies.map(function (currency) {
      return trustCurrency(currency, '0');
    })).then(function () {
      delete walletGateways()[gateway.domain];
    })
    .catch(function () {
      //TODO: add reasing as to _why_ the remove failed
      gateway.status = "removal_failed";
    });
  }

  function addGateway(gateway) {
    return $q.all(gateway.currencies.map(function (currency) {
      return trustCurrency(currency, '9223372036854775806');
    })).then(function () {
      walletGateways()[gateway.domain].status = "added";
    })
    .catch(function () {
      //TODO: add reasing as to _why_ the add failed
      gateway.status = "add_failed";
    });
  }

  function walletGateways() {
    var mainData = session.get('wallet').mainData;
    mainData.gateways = mainData.gateways || {};
    return mainData.gateways;
  }

  function domainsWithStatus(status) {
    return _.select(walletGateways(), {status:status});
  }


  function trustCurrency(currency, value) {
    var deferred = $q.defer();
    var limit    = _.extend({value: value}, currency);

    var tx = stNetwork.remote.transaction();
    tx.trustSet(session.get('address'), limit);
    tx.setFlags('NoRipple');

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

  return Gateways;
});