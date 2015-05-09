var filterMod = angular.module('filters', []);
var Amount = stellar.Amount;

/* jshint camelcase:false */


// TODO: var iso4217 = require('../data/iso4217');
// TODO: var webutil = require('../utilities/web');

/**
* Pretty print an Amount object with the correct number of decimal places based on currency.
*/
filterMod.filter('amountToHuman', function () {

    return function (input) {
        if (!input) {
            return "";
        }
        var opts = {};
        var currency = StellarDefaultCurrencyMap[input._currency.to_human()];
        opts.precision = currency ? currency.maxDecimalPlaces : 2;
        opts.skip_empty_fraction = true;
        opts.max_sig_digits = 6;
        return input.to_human(opts);
    };
});

/**
* Takes an amount and currency code and formats it with the the number of decimal places as specified in currencies.js
*/
filterMod.filter('roundAmount', function () {
    return function (amount, currency) {
        try {
            amount = amount.toString();
            new BigNumber(amount);
        } catch (e) {
            return 0;
        }

        var precision = 4;
        var currencyInfo = StellarDefaultCurrencyMap[currency];
        // Also handles the case where currency is undefined
        if (typeof currencyInfo !== 'undefined') {
            precision = currencyInfo.maxDecimalPlaces;
        }

        return new BigNumber(amount).round(precision).toString();
    };
});

/**
* Turn a stellar address into a username
*/
filterMod.filter('addressToUsername', function (contacts) {
    return function (input, options) {
        var contact = contacts.getContactByAddress(input);

        if (contact) {
          if (contact.domain === Options.DEFAULT_FEDERATION_DOMAIN) {
            return contact.destination;
          } else {
            return contact.destination + "@" + contact.domain;
          }
        }
        if (!input){
            return ""; // no issuer for STR
        }
        return input;
    };
});

/**
 * Format a ripple.Amount.
 *
 * If the parameter is a number, the number is treated the relative
 */
filterMod.filter('rpamount', function () {
    return function (input, options) {
        var defaults = {
            floor: true
        };
        var opts = jQuery.extend(true, defaults, options);

        if ("number" === typeof opts) {
            opts = {
                rel_min_precision: opts
            };
        } else if ("object" !== typeof opts) {
            opts = {};
        }

        if (input === null || typeof input === 'undefined') { return "n/a"; }

        if (opts.xtr_human && input === ("" + parseInt(input, 10))) {
            input = input + ".0";
        }

        var amount = Amount.from_json(input);
        if (!amount.is_valid()) { return "n/a"; }

        // Currency default precision
        var currency = iso4217[amount.currency().to_json()];
        var cdp = ("undefined" !== typeof currency) ? currency[1] : 4;

        // Certain formatting options are relative to the currency default precision
        if ("number" === typeof opts.rel_precision) {
            opts.precision = cdp + opts.rel_precision;
        }
        if ("number" === typeof opts.rel_min_precision) {
            opts.min_precision = cdp + opts.rel_min_precision;
        }

        // If no precision is given, we'll default to max precision.
        if ("number" !== typeof opts.precision) {
            opts.precision = 16;
        }

        // But we will cut off after five significant decimals
        if ("number" !== typeof opts.max_sig_digits) {
            opts.max_sig_digits = 6;
        }

        var out = amount.to_human(opts);

        // If amount is very small and only has zeros (ex. 0.0000), raise precision
        // to make it useful.
        if (out.length > 1 && 0 === +out && !opts.hard_precision) {
            opts.precision = 20;

            out = amount.to_human(opts);
        }

        // Floor the balance
        if (opts.floor) {
            out = out.split('.')[0];
        }

        return out;
    };
});

/**
 * Get the currency from an Amount.
 */
filterMod.filter('rpcurrency', function () {
    return function (input) {
        if (!input) { return ""; }

        var amount = Amount.from_json(input);
        return amount.currency().to_json();
    };
});

/**
 * Get the currency issuer.
 */
filterMod.filter('rpissuer', function () {
    return function (input) {
        if (!input) { return ""; }

        var amount = Amount.from_json(input);
        return amount.issuer().to_json();
    };
});

filterMod.filter('shrinkText', function($sce){
  /**
   * Shrink the font size of a piece of text if it is longer than the maximum allowed length.
   *
   * @param {string} text The text to shrink.
   * @param {number} fontSize The original font size in pixels.
   * @param {number} max The maximum number of characters allowed before shrinking the text.
   *
   * @return {$sce.trustedHTML} The original text or a span tag containing the shrunken the text.
   */
  return function(text, fontSize, max){
    if(text.length > max) {
      var ratio = max / text.length;
      var newFontSize = Math.floor(fontSize * ratio);
      return $sce.trustAsHtml('<span style="font-size:' + newFontSize + 'px;">' + text + '</span>');
    } else {
      return $sce.trustAsHtml(text);
    }
  };
});

filterMod.filter('currencyName', function() {
    return function(currency) {
        var description = StellarDefaultCurrencyMap[currency] || {};
        return description.name || currency;
    };
});

filterMod.filter('roundedAmount', function() {
    return function(amount, precision) {
        try {
            amount = amount.toString();
            return new BigNumber(amount).round(precision).toString();
        } catch (e) {
            return 0;
        }
    };
});
