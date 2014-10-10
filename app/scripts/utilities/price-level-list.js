angular.module('stellarClient').factory('PriceLevelList', function(FriendlyOffers) {

  /**
   * @param {string} offerType (either 'bid' or 'ask')
   * @param {array} offers array from order-book.js
   * @param {object} currency pair: {baseCurrency: currency struct, counterCurrency: currency struct}
   */
  var getPriceLevelList = function(offerType, offers, currencyPair) {
    var priceLevels = offers.map(function(offer) {
      var friendlyOffer = FriendlyOffers.get(offer, currencyPair);
      return {
        currencyPair: friendlyOffer.currencyPair,
        price:        friendlyOffer.price.value,
        amount:       friendlyOffer.baseAmount.value,
        totalValue:   friendlyOffer.counterAmount.value,
        depth:        '0',
      };
    });

    var merged = mergePriceLevels(priceLevels);
    var sorted = sortPriceLevels(merged, offerType === 'asks');
    var calculated = calculateDepths(sorted);

    return calculated.map(toString);
  };

  function mergePriceLevels(priceLevels) {
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

    return merged.value();
  }

  function sortPriceLevels(mergedPriceLevels, ascending) {
    var sorted;

    if (ascending) {
      sorted = mergedPriceLevels.sort(sortAscending);
    } else {
      sorted = mergedPriceLevels.sort(sortDescending);
    }

    return sorted;
  }

  function calculateDepths(sortedPriceLevels) {
    var depthTotal = new BigNumber(0);
    var calculated = _(sortedPriceLevels)
      .forEach(function(priceLevel) {
        depthTotal = depthTotal.plus(priceLevel.amount);
        priceLevel.depth = depthTotal;
      });

    return calculated.value();
  }


  function toBigNumber(priceLevel) {
    return _.mapValues(priceLevel, function(v, k) {
      if (k === 'currencyPair'){ return v; }
      return new BigNumber(v);
    });
  }

  function sortAscending(a, b) {
    return new BigNumber(a.price).cmp(b.price);
  }

  function sortDescending(a, b) {
    return sortAscending(b, a);
  }

  function toString(priceLevel) {
    return _.mapValues(priceLevel, function(v, k) {
      if(k === 'currencyPair'){ return v; }
      return v.toString();
    });
  }

  return {
    get: getPriceLevelList
  };

});
