'use strict';

angular.module('mockStellarNetwork', [])
  .factory('StellarNetwork', [function() {
    var transaction = {}
    var network = {
      remote: {
        transaction: function () {return transaction}
      }
    };
    return network
  }]);