'use strict';

angular.module('stellarClient').service('rippleGiveaway', function($http, usernameProof, session) {
  var api = {};
  var wallet = session.get('wallet');
  var proof = usernameProof(wallet.keychainData.signingKeys, wallet.walletV2.getUsername());

  api.getAddress = function(address) {
    return $http.post(Options.RIPPLE_GIVEAWAY_SERVER+'/get-address', {
      address: address
    });
  };

  api.getClaimData = function() {
    return $http.post(Options.RIPPLE_GIVEAWAY_SERVER+'/get-claim-data', {
      usernameProof: proof
    });
  };

  return api;
});
