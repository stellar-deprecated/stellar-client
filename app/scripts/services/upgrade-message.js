angular.module('stellarClient').factory('upgradeMessage', function () {
  return function(signingKeys, newAddress) {
    var data = JSON.stringify({
      newAddress: newAddress
    });
    var signature = nacl.sign.detached(
      nacl.util.decodeUTF8(data),
      nacl.util.decodeBase64(signingKeys.secretKey)
    );
    signature = nacl.util.encodeBase64(signature);
    return {
      data: data,
      publicKey: signingKeys.publicKey,
      signature: signature
    };
  };
});
