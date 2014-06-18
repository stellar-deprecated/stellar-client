/**
 * The base58check object provides the encode and decode functions.
 * TODO: Fix the existing base58check repos, then use one of them.
 * @protected
 */
var base58check = {};

/**
 * Wrap sjcl.hash.sha256.hash to pass the parameters with the correct encoding.
 *
 * @param {Array.<bytes>} bytes The array of bytes to hash.
 * @returns {Array.<bytes>} The hashed array of bytes.
 */
function SHA256(bytes){ return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes))); }

/**
 * Encodes the input into base58check which includes additional data that
 * allows the result to be checked to ensure integrity.
 * @potected
 *
 * @param {Number} version The version number to encode into the output.
 * @param {Array.<bytes>} input The input to encode.
 *
 * @return {string} The input encoded in base58check.
 */
base58check.encode = function (version, input) {
  var buffer = [].concat(version, input);
  var check = SHA256(SHA256(buffer)).slice(0, 4);
  return base58.encode([].concat(buffer, check));
};

/**
 * Decodes the input from base58check and checks that the hash is valid and
 * the version number matches.
 * @potected
 *
 * @param {Number} version The version number to encode into the output.
 * @param {Array.<bytes>} input The input to decode.
 *
 * @return {Array.<bytes>} The byte array decoded from base58check.
 */
base58check.decode = function(version, input) {
  var buffer = base58.decode(input);

  if (!buffer || buffer[0] !== version || buffer.length < 5) {
    return NaN;
  }

  var computed = SHA256(SHA256(buffer.slice(0, -4))).slice(0, 4),
    checksum = buffer.slice(-4);

  var i;
  for (i = 0; i != 4; i += 1)
    if (computed[i] !== checksum[i])
      return NaN;

  return buffer.slice(1, -4);
};
