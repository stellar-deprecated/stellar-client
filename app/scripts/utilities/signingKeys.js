/**
 * A pair of signing keys and the address of the public key.
 *
 * @param {object} keys
 * @param {sjcl.ecc.ecdsa.publicKey} keys.publicKey
 * @param {sjcl.ecc.ecdsa.secretKey} keys.secretKey
 *
 * @constructor
 */
var SigningKeys = function(keys) {
  this.publicKey = keys.pub;
  this.secretKey = keys.sec;
  this.address = SigningKeys.getAddress(keys.pub);
};

/**
 * Randomly generates a 256bit ECDSA key pair for signing.
 *
 * @returns {SigningKeys}
 */
SigningKeys.generate = function(){
  var keys = sjcl.ecc.ecdsa.generateKeys(256, 1);
  return new SigningKeys(keys);
};

/**
 * Decodes a key pair using the base58check encoding.
 *
 * @param {Object} encodedKeys
 * @param {string} encodedKeys.pub The public key to decode.
 * @param {string} encodedKeys.sec The secret key to decode.
 *
 * @return {SigningKeys}
 */
SigningKeys.unpack = function(encodedKeys) {
  var pub = sjcl.codec.bytes.toBits(base58check.decode(0, encodedKeys.pub));
  // Hack: sjcl.bn does not like initializing from a bit array, but works fine when hex is used.
  var sec = new sjcl.bn(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(base58check.decode(33, encodedKeys.sec))));

  var keys = {
    pub: new sjcl.ecc.ecdsa.publicKey(sjcl.ecc.curves.c256, pub),
    sec: new sjcl.ecc.ecdsa.secretKey(sjcl.ecc.curves.c256, sec)
  };

  return new SigningKeys(keys);
};

/**
 * Packs the key pair using the base58check encoding.
 *
 * @return {
 *   {
 *     pub: {string} The base58check encoded public key,
 *     sec: {string} The base58check encoded private key
 *   }
 * }
 */
SigningKeys.prototype.pack = function() {
  var pub = this.publicKey.get();
  var sec = this.secretKey.get();

  return {
    pub: base58check.encode(0, sjcl.codec.bytes.fromBits(pub.x.concat(pub.y))),
    sec: base58check.encode(33, sjcl.codec.bytes.fromBits(sec))
  };
};

/**
 * Calculates an address from a public key.
 *
 * @param {sjcl.ecc.ecdsa.publicKey} publicKey
 */
SigningKeys.getAddress = function(publicKey) {
  var pub = this.publicKey.get();
  var bits = pub.x.concat(pub.y);

  return base58check.encode(0, sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(bits)));
};
