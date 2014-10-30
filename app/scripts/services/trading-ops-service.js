var sc = angular.module('stellarClient');
/**
 * Low-level, stateless trading operations service that other portions
 * of the trading components can depend upon for interacting with the
 * stellar network
 *
 * @namespace TradingOps
 * 
 */
sc.service('TradingOps', function(session, StellarNetwork, TransactionCurator) {

  this.createOffer = function(takerPays, takerGets) {
    var tx = StellarNetwork.remote.transaction();
    tx.offerCreate({
      "account":    session.get("address"),
      "taker_pays": StellarNetwork.amount.encode(takerPays),
      "taker_gets": StellarNetwork.amount.encode(takerGets),
    });

    return StellarNetwork.sendTransaction(tx).then(function (tx) {
      return {
        result: TransactionCurator.offerStateFromOfferCreate(tx),
        offer: TransactionCurator.offerFromOfferCreate(tx)
      };
    });
  };

  this.myOffers = function() {
    var account = session.get("address");

    return StellarNetwork.request("account_offers", {
      account: account
    }).then(function(response) {
        var normalizedOffers = response.offers.map(function (nativeOffer) {
          /*jshint camelcase: false */
          return {
            account:   account,
            sequence:  nativeOffer.seq,
            takerPays: StellarNetwork.amount.decode(nativeOffer.taker_pays),
            takerGets: StellarNetwork.amount.decode(nativeOffer.taker_gets),
          };
        });

        return normalizedOffers;
    });
  };


  this.cancelOffer = function(sequence) {
    var tx = StellarNetwork.remote.transaction();

    tx.offerCancel({
      "account":  session.get("address"),
      "sequence": sequence,
    });

    return StellarNetwork.sendTransaction(tx);
  };
});