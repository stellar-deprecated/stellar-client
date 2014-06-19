!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.StellarWallet=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Base58Utils = (function () {
  var alphabets = {
    'stellar':  "gpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCr65jkm8oFqi1tuvAxyz",
    'bitcoin': "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  };

  var SHA256  = function (bytes) {
    return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
  };

  return {
    // --> input: big-endian array of bytes.
    // <-- string at least as long as input.
    encode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'stellar'],
          base     = new sjcl.bn(alphabet.length),
          bi       = sjcl.bn.fromBits(sjcl.codec.bytes.toBits(input)),
          buffer   = [];

      while (bi.greaterEquals(base)) {
        var mod = bi.mod(base);
        buffer.push(alphabet[mod.limbs[0]]);
        bi = bi.div(base);
      }
      buffer.push(alphabet[bi.limbs[0]]);

      // Convert leading zeros too.
      for (var i = 0; i != input.length && !input[i]; i += 1) {
        buffer.push(alphabet[0]);
      }

      return buffer.reverse().join("");
    },

    // --> input: String
    // <-- array of bytes or undefined.
    decode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'stellar'],
          base     = new sjcl.bn(alphabet.length),
          bi       = new sjcl.bn(0);

      var i;
      while (i != input.length && input[i] === alphabet[0]) {
        i += 1;
      }

      for (i = 0; i != input.length; i += 1) {
        var v = alphabet.indexOf(input[i]);

        if (v < 0) {
          return null;
        }

        bi = bi.mul(base).addM(v);
      }

      var bytes = sjcl.codec.bytes.fromBits(bi.toBits()).reverse();

      // Remove leading zeros
      while(bytes[bytes.length-1] === 0) {
        bytes.pop();
      }

      // Add the right number of leading zeros
      for (i = 0; input[i] === alphabet[0]; i++) {
        bytes.push(0);
      }

      bytes.reverse();

      return bytes;
    },

    // --> input: Array
    // <-- String
    encode_base_check: function (version, input, alphabet) {
      var buffer  = [].concat(version, input);
      var check   = SHA256(SHA256(buffer)).slice(0, 4);
      return Base58Utils.encode_base([].concat(buffer, check), alphabet);
    },

    // --> input : String
    // <-- NaN || BigInteger
    decode_base_check: function (version, input, alphabet) {
      var buffer = Base58Utils.decode_base(input, alphabet);

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
    }
  };
})();

module.exports = Base58Utils;

},{}],2:[function(_dereq_,module,exports){
var base58 = _dereq_('./base58.js');

function MasterKey(key){ 
  this.value = key;
};

MasterKey.fromBytes = function(bytes){
  return new MasterKey(base58.encode_base_check(33, bytes));
};

MasterKey.getRandom = function(){
  for (var i = 0; i < 8; i++) {
    sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
  }
  var randomBytes = sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4));
  return MasterKey.fromBytes(randomBytes);
};

module.exports = MasterKey;


},{"./base58.js":1}],3:[function(_dereq_,module,exports){
var base58 = _dereq_('./base58.js');

function SHA256_RIPEMD160(bits) {
  return sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
}

function StellarAddress(address){
  this.value = address;
}

StellarAddress.fromPublicKey = function(publicKey){
  /* Encode the EC public key as a stellar address
     using SHA256 and then RIPEMD160
  */
  var publicKeyBytes = sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(sjcl.codec.bytes.toBits(publicKey.toBytesCompressed())));
  return new this(base58.encode_base_check(0, publicKeyBytes));
}

module.exports = StellarAddress;


},{"./base58.js":1}],4:[function(_dereq_,module,exports){
var base58 = _dereq_('./base58.js');
var MasterKey = _dereq_('./master_key.js');
var StellarAddress = _dereq_('./stellar_address.js');

function firstHalfOfSHA512(bytes) {
  return sjcl.bitArray.bitSlice(
    sjcl.hash.sha512.hash(sjcl.codec.bytes.toBits(bytes)),
    0, 256
  );
}

function append_int(a, i) {
  return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff)
}

function StellarWallet(secret){
  this.secret = secret;

  if (!this.secret) {
    throw "Invalid secret."
  }
}

StellarWallet.prototype.getPrivateKey = function(secret){
  return base58.decode_base_check(33, secret);
}

StellarWallet.prototype.getPrivateGenerator = function(privateKey){
  var i = 0;
  do {
    // Compute the hash of the 128-bit privateKey and the sequenceuence number
    privateGenerator = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(privateKey, i)));
    i++;
    // If the hash is equal to or greater than the SECp256k1 order, increment sequenceuence and try agin
  } while (!sjcl.ecc.curves.c256.r.greaterEquals(privateGenerator));
  return privateGenerator; 
}

StellarWallet.prototype.getPublicGenerator = function (privateGenerator){
  /* Compute the public generator using from the 
     private generator on the elliptic curve
  */
  return sjcl.ecc.curves.c256.G.mult(privateGenerator);
}

StellarWallet.prototype.getPublicKey = function(publicGenerator, sequence){
  var sec;
  var i = 0;
  do {
    // Compute the hash of the public generator with sub-sequenceuence number
    sec = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(append_int(publicGenerator.toBytesCompressed(), sequence), i)));
    i++;
    // If the hash is equal to or greater than the SECp256k1 order, increment the sequenceuence and retry
  } while (!sjcl.ecc.curves.c256.r.greaterEquals(sec));
  // Treating this hash as a private key, compute the corresponding public key as an EC point. 
  return sjcl.ecc.curves.c256.G.mult(sec).toJac().add(publicGenerator).toAffine();
}

StellarWallet.prototype.getAddress = function(sequence){
  sequence = sequence || 0;

  var privateKey = this.getPrivateKey(this.secret);
  var privateGenerator = this.getPrivateGenerator(privateKey);
  var publicGenerator = this.getPublicGenerator(privateGenerator);
  var publicKey = this.getPublicKey(publicGenerator, sequence);

  return StellarAddress.fromPublicKey(publicKey);
}

StellarWallet.getRandom = function(){
  var secretKey = MasterKey.getRandom().value;
  return new StellarWallet(secretKey);
};

StellarWallet.generate = function(sequence) {
  /* Generate a 128-bit master key that can be used to make 
     any number of private / public key pairs and accounts
  */
  var secretKey = MasterKey.getRandom().value;
  var wallet = new StellarWallet(secretKey);

  return {
    address: wallet.getAddress(sequence).value,
    secret: secretKey 
  };
};

module.exports = StellarWallet;


},{"./base58.js":1,"./master_key.js":2,"./stellar_address.js":3}]},{},[4])
(4)
});