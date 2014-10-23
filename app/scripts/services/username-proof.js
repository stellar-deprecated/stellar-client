angular.module('stellarClient').factory('usernameProof', function () {
  return function(signingKeys, username) {
    var claim = JSON.stringify({
      username: username,
      address: signingKeys.address
    });
    var signature = nacl.sign.detached(
        nacl.util.decodeUTF8(claim),
        nacl.util.decodeBase64(signingKeys.secretKey)
    );
    signature = nacl.util.encodeBase64(signature);
    return {
      claim: claim,
      publicKey: signingKeys.publicKey,
      signature: signature
    };
  };
});
