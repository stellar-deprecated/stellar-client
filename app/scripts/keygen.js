var keygen = angular.module('keygen', ['base58check'])
  .service('KeyGen', function(base58check){
    /**
     * The service used to generate, encode, and decode key pairs.
     * Keys are generated using the ECDSA p256k1 curve (in sjcl.ecc.ecdsa).
     * Keys are encoded/decoded using the base58check functions.
     */
    var KeyGen = {};

    /**
     * Wrap CryptoJS.RIPEMD160 to pass the parameters with the correct encoding.
     * @private
     *
     * @param {Array.<bytes>} bytes The array of bytes to hash.
     * @returns {Array.<bytes>} The hashed array of bytes.
     */
    function RIPEMD160(bytes){ return CryptoJS.RIPEMD160(new CryptoJS.lib.WordArray.init(bytes)).words; }

    /**
     * Wrap RIPEMD160(sjcl.hash.sha256) to pass the parameters with the correct encoding.
     * @private
     *
     * @param {Array.<bits>} bits The array of bits to hash.
     * @returns {Array.<bytes>} The hashed array of bytes.
     */
    function SHA256_RIPEMD160(bits) { return RIPEMD160(sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(bits))); }

    /**
     * Creates an address from a public key.
     *
     * @param {string} publicKey The base58check encoded public key.
     */
    KeyGen.getAddress = function (publicKey) {
      var bits = sjcl.codec.bytes.toBits(base58check.decode(0, publicKey));
      return base58check.encode(0, sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(bits)));
    };

    /**
     * Generates a public/private key pair using the ECDSA p256k1 curve.
     *
     * @return {
     *   {
     *     pub: sjcl.ecc.ecdsa.publicKey,
     *     sec: sjcl.ecc.ecdsa.secretKey
     *   }
     * }
     */
    KeyGen.generateKeys = function () {
      return sjcl.ecc.ecdsa.generateKeys(256, 1);
    };

    /**
     * Packs a public/private key pair using the base58check encoding.
     *
     * @param {Object} keys The public/private key pair to encode.
     * @param {sjcl.ecc.ecdsa.publicKey} keys.pub The public key to encode.
     * @param {sjcl.ecc.ecdsa.secretKey} keys.sec The private key to encode.
     *
     * @return {
     *   {
     *     pub: {string} The base58check encoded public key,
     *     sec: {string} The base58check encoded private key
     *   }
     * }
     */
    KeyGen.pack = function (keys) {
      var pub = keys.pub.get();
      var sec = keys.sec.get();

      return {
        pub: base58check.encode(0, sjcl.codec.bytes.fromBits(pub.x.concat(pub.y))),
        sec: base58check.encode(0x80, sjcl.codec.bytes.fromBits(sec))
      };
    };

    /**
     * Unpacks a public/private key pair using the base58check decoding.
     *
     * @param {Object} keys The public/private key pair to encode.
     * @param {string} keys.pub The public key to encode.
     * @param {string} keys.sec The private key to encode.
     *
     * @return {
     *   {
     *     pub: {(sjcl.ecc.ecdsa.publicKey)} The decoded public key,
     *     sec: {(sjcl.ecc.ecdsa.secretKey)} The decoded private key
     *   }
     * }
     */
    KeyGen.unpack = function (keys) {
      var pub = sjcl.codec.bytes.toBits(base58check.decode(0, keys.pub));
      // Hack: sjcl.bn does not like initializing from a bit array, but works fine when hex is used.
      var sec = new sjcl.bn(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(base58check.decode(0x80, keys.sec))));

      return {
        pub: new sjcl.ecc.ecdsa.publicKey(sjcl.ecc.curves.c256, pub),
        sec: new sjcl.ecc.ecdsa.secretKey(sjcl.ecc.curves.c256, sec)
      };
    };

    return KeyGen;
  })
;
