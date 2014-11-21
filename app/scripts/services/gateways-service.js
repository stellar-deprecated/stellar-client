var sc = angular.module('stellarClient');

sc.service('Gateways', function($q, $analytics, session, StellarNetwork, rpStellarTxt) {

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

          // Check if each currency's issuer require authorization.
          var promises = _.map(currencies, checkIssuerAuth);

          return $q.all(promises)
            .then(function(currencies) {
              return {
                domain: domain,
                currencies: currencies
              };
            });
      });
  };

  Gateways.add = function(gateway) {
    walletGateways()[gateway.domain]        = _.cloneDeep(gateway);
    walletGateways()[gateway.domain].status = "adding";
    return Gateways.syncTrustlines(gateway.domain).then(function() {
      gateway = walletGateways()[gateway.domain];

      if(gateway.status === "added") {
        track(gateway, 'Gateway Added');
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
        track(gateway, 'Gateway Removed');
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

  Gateways.findByIssuer = function(issuer) {
    return _.find(walletGateways(), function(gateway) {
      return !!_.find(gateway.currencies, {issuer: issuer});
    });
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

  Gateways.markAllRemoved = function() {
    var mainData = session.get('wallet').mainData;
    mainData.gateways = {};

    return session.syncWallet('update');
  };

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


  /**
   * Issues a TrustSet transaction
   *
   * @param  {Currency} currency the currency to trust
   * @param  {string} value     the value to set the trustline at
   * @return {Promise}          resolved if the transaction succeeds
   */
  function trustCurrency(currency, value) {
    var deferred = $q.defer();
    var limit    = _.extend({value: value}, currency);

    var tx = StellarNetwork.remote.transaction();
    tx.trustSet(session.get('address'), limit);

    if (value === '0') {
      tx.setFlags('ClearNoRipple');
    } else {
      tx.setFlags('NoRipple');
    }

    tx.on('success', deferred.resolve);
    tx.on('error', function(result) {
      /*jshint camelcase: false */
      if(result.engine_result === "tecNO_LINE_REDUNDANT") {
        deferred.resolve();
      } else {
        deferred.reject(result);
      }
    });

    tx.submit();

    return deferred.promise;
  }

  /**
   * Sets the currency's requireAuth property to true if the issuer requires authorization.
   * Returns a promise that always resolves with the provided currency object.
   */
  function checkIssuerAuth(currency) {
    /*jshint camelcase: false */
    /*jshint bitwise: false */
    var deferred = $q.defer();

    var opts = {account: currency.issuer};
    StellarNetwork.remote.request_account_info(opts, function(err, result) {
      if (result) {
        currency.requireAuth = !!(result.account_data.Flags & stellar.Transaction.flags.AccountSet.RequireAuth);
      }

      deferred.resolve(currency);
    });

    return deferred.promise;
  }

  function track(gateway, event) {
    var currencies = _.map(gateway.currencies, function(c) {
      return _.pick(c, ['currency', 'issuer']);
    });
    
    $analytics.eventTrack(event, {
      currency: currencies,
      name:     gateway.domain
    });
  }

  return Gateways;
});