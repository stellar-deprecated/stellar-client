angular.module('stellarClient').service('FriendlyOffers', function($q, CurrencyPairs) {
  var self = this;

  this.get = function(offer, currencyPair) {
    var operation;

    switch(self.getOfferRole(offer, currencyPair)) {
    case "bid":
      operation = "buy";
      break;
    case "ask":
      operation = "sell";
      break;
    default:
      // NOTE: we should only get here when the currencyPair
      // does not match the currencies of the offer we are classifying
      throw new Error("Cannot create a FriendlyOffer: offer is not compatible with the provided currencyPair");
    }

    var baseAmount, counterAmount;
    var takerPaysCurrency = _.pick(offer.takerPays, 'currency', 'issuer');

    if(_.isEqual(takerPaysCurrency, currencyPair.baseCurrency)) {
      baseAmount    = offer.takerPays;
      counterAmount = offer.takerGets;
    } else {
      baseAmount    = offer.takerGets;
      counterAmount = offer.takerPays;
    }

    var rawPrice = new BigNumber(counterAmount.value).div(baseAmount.value).toString();
    var price    = _.extend({value:rawPrice}, currencyPair.counterCurrency);

    return {
      account:       offer.account,
      sequence:      offer.sequence,
      currencyPair:  currencyPair,
      operation:     operation,
      baseAmount:    baseAmount,
      counterAmount: counterAmount,
      price:         price
    };
  };

  /**
   * Returns both FriendlyOffer objects that can be derived from a given Offer,
   * one given one direction of the currencyPair involved, as well as the inverse
   * 
   * @param  {Offer} offer
   * @return {Array.<FriendlyOffer>}
   */
  this.getBoth = function(offer) {
    var currencyPair = {
      baseCurrency:    _.pick(offer.takerGets, 'currency', 'issuer'),
      counterCurrency: _.pick(offer.takerPays, 'currency', 'issuer'),
    };

    var inverseCurrencyPair = CurrencyPairs.invert(currencyPair);

    return [
      this.get(offer, currencyPair),
      this.get(offer, inverseCurrencyPair),
    ];
  };

  /**
   * Returns the "role" that an offer plays in relation to the provided
   * currencyPair.  That is, within an order book identified by the 
   * provided currencyPair, would this offer be an ask, a bid, or none in the
   * case where the currencies in the offer are not the currencyPair provided.
   * 
   * @param  {Offer}        offer        the offer to classify
   * @param  {CurrencyPair} currencyPair the currencyPair to classify the order against
   * @return {string}                    "bid", "ask", or "none"
   */
  this.getOfferRole = function(offer, currencyPair) {
    if(!currencyPair) {
      throw new Error("No currencyPair supplied");
    }

    var bidPair = {
      baseCurrency:    _.pick(offer.takerPays, 'currency', 'issuer'),
      counterCurrency: _.pick(offer.takerGets, 'currency', 'issuer'),
    };

    var askPair = CurrencyPairs.invert(bidPair);

    if (_.isEqual(bidPair, currencyPair)) {
      return 'bid';
    } else if (_.isEqual(askPair, currencyPair)) {
      return 'ask';
    } else {
      return 'none';
    }
  };

  this.toPriceLevel = function(friendlyOffer) {
    return {
      currencyPair: friendlyOffer.currencyPair,
      price:        friendlyOffer.price.value,
      amount:       friendlyOffer.baseAmount.value,
      totalValue:   friendlyOffer.counterAmount.value,
    };
  };
});


