angular.module('stellarClient').factory('PriceLevelList', function(FriendlyOffers) {

  /**
   * @param {string} offerType (either 'bid' or 'ask')
   * @param {array} offers array from order-book.js
   * @param {object} currency pair: {baseCurrency: currency struct, counterCurrency: currency struct}
   */
  var getPriceLevelList = function(offerType, offers, currencyPair) {
    var priceLevels = offers.map(function(offer) {
      var friendlyOffer = FriendlyOffers.get(offer, currencyPair);
      return toPriceLevel(friendlyOffer);
    });

    return processPriceLevels(priceLevels, offerType === 'asks');
  };

  var processPriceLevels = function(priceLevels, ascending) {

    function toBigNumber(priceLevel) {
      return _.mapValues(priceLevel, function(v, k) {
        if(k === 'currencyPair'){ return v; }
        return new BigNumber(v);
      });
    }
    function toString(priceLevel) {
      return _.mapValues(priceLevel, function(v, k) {
        if(k === 'currencyPair'){ return v; }
        return v.toString();
      });
    }
    function sortAscending(a, b) {
      return new BigNumber(a.price).cmp(b.price);
    }
    function sortDescending(a, b) {
      return sortAscending(b, a);
    }

    var merged = _(priceLevels)
      .map(toBigNumber)
      .groupBy('price')
      .map(function(priceLevels, price) {

        var sum = function(numbers) {
          return numbers.reduce(function(left, right) {
            return left.plus(right);
          });
        };

        var totalAmount = sum(_(priceLevels).pluck('amount'));
        var totalValue  = sum(_(priceLevels).pluck('totalValue'));

        return {
          price:      price,
          amount:     totalAmount,
          totalValue: totalValue,
        };
      });

    var sorted;

    if(ascending) {
      sorted = merged.sort(sortAscending);
    } else {
      sorted = merged.sort(sortDescending);
    }

    var depthTotal = new BigNumber(0);
    var summed = sorted
      .forEach(function(priceLevel) {
        depthTotal = depthTotal.plus(priceLevel.amount);
        priceLevel.depth = depthTotal;
      });

    var result = summed.map(toString);

    return result.value();
  };

  function toPriceLevel(friendlyOffer) {
    return {
      currencyPair: friendlyOffer.currencyPair,
      price:        friendlyOffer.price.value,
      amount:       friendlyOffer.baseAmount.value,
      totalValue:   friendlyOffer.counterAmount.value,
    };
  }

  return {
    get: getPriceLevelList
  };

});