var dataBlob = angular.module('dataBlob', [])
  .factory('DataBlob', function(){
    /**
     * Creates a data object that can be encrypted and decrypted using
     * 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
     *
     * @param {Object} [blob] Another blob or object containing the data to use.
     *
     * @constructor
     */
    var DataBlob = function(blob){
      this.data = (blob && blob.data) || {};
    };

    /**
     * Configure the blob cryptography setting.
     */
    var settings = {
      pbkdf2: {
        iterations: 1000,
        size: 256 // Must be a valid AES key size.
      }
    };

    /**
     * Encode a bit array into a utf8 string.
     * This function is required, because sjcl.codec.utf8String.fromBits()
     * is deprecated and fails to handle some binary values.
     *
     * @param {Array.<bits>} bits The array of bits to encode.
     *
     * @returns {string} The utf8 encoded string.
     */
    function bitsToString(bits){
      var bytes = sjcl.codec.bytes.fromBits(bits);
      return String.fromCharCode.apply(null, bytes);
    }

    DataBlob.prototype.get = function(name){
      return this.data[name];
    };

    DataBlob.prototype.put = function(name, value){
      return this.data[name] = value;
    };

    /**
     * Encrypt the blob's data using 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
     *
     * @param {string | Array.<bits>} key The key used to encrypt the blob.
     *
     * @return {string} The encrypted data encoded as base64.
     */
    DataBlob.prototype.encrypt = function(key){
      // Encode blob data into a JSON byte array.
      var rawData = sjcl.codec.utf8String.toBits(JSON.stringify(this.data));

      // Expand the key into a randomly salted cipher key using PBKDF2.
      var rawCipherSalt = sjcl.random.randomWords(4);
      var rawCipherKey = sjcl.misc.pbkdf2(key, rawCipherSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);

      // Initialize the AES algorithm with the cipher key.
      var cipher = new sjcl.cipher.aes(rawCipherKey);

      // SJCL doesn't know we are using HMAC-SHA256 to check integrity.
      // TODO: Consider using GCM mode to avoid implementation errors.
      sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

      // Encrypt the blob data in CBC mode using AES and a random 128bit IV.
      var rawIV = sjcl.random.randomWords(4);
      var rawEncryptedText = sjcl.mode.cbc.encrypt(cipher, rawData, rawIV);

      // Concatenate the IV, cipher salt, and encrypted blob data respectively into the cipher text.
      var rawCipherText = rawIV.concat(rawCipherSalt, rawEncryptedText);
      var cipherText = bitsToString(rawCipherText);

      // Expand the key into a randomly salted hash key using PBKDF2.
      var rawHashSalt = sjcl.random.randomWords(4);
      var rawHashKey = sjcl.misc.pbkdf2(key, rawHashSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);
      var hashKey = bitsToString(rawHashKey);

      // Calculate the authentication hash of the cipher text using HMAC-SHA256.
      var rawHash = CryptoJS.HmacSHA256(cipherText, hashKey).words;

      // Encrypted data structure:
      //  ------------------------------------- ------------------------------------------------------
      // |        HMAC-SHA256(cipherText)      |                      cipherText                      |
      // |-------------------------------------|------------------------------------------------------|
      // | hash (8 bytes) | hashSalt (4 bytes) | IV (4 bytes) | cipherSalt (4 bytes) | data (n bytes) |
      //  ------------------------------------- ------------------------------------------------------
      var rawEncryptedData = rawHash.concat(rawHashSalt, rawCipherText);
      return sjcl.codec.base64.fromBits(rawEncryptedData);
    };

    /**
     * Decrypt and set the blob's data using 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
     *
     * @param {string} encryptedData The encrypted data encoded as base64.
     * @param {string | Array.<bits>} key The key used to decrypt the blob.
     */
    DataBlob.prototype.decrypt = function(encryptedData, key){
      // Decode the base64 encode data into a bit array.
      var rawEncryptedData = sjcl.codec.base64.toBits(encryptedData);

      // Extract the authentication hash and hash salt from the encrypted data.
      var rawGivenHash = rawEncryptedData.slice(0, 8);
      var givenHash = bitsToString(rawGivenHash);
      var rawHashSalt = rawEncryptedData.slice(8, 12);

      // Expand the key into a hash key using PBKDF2 with the given hash salt.
      var rawHashKey = sjcl.misc.pbkdf2(key, rawHashSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);
      var hashKey = bitsToString(rawHashKey);

      // Extract the cipher text from the encrypted data.
      var rawCipherText = rawEncryptedData.slice(12);
      var cipherText = bitsToString(rawCipherText);

      // Calculate the authentication hash of the cipher text using HMAC-SHA256.
      var rawCalculatedHash = CryptoJS.HmacSHA256(cipherText, hashKey).words;
      var calculatedHash = bitsToString(rawCalculatedHash);

      // Ensure that the given cipher text hash matches the calculated cipher text hash.
      if(givenHash !== calculatedHash) throw("Message integrity check failed!");

      // Extract the IV, cipher salt, and encrypted blob data from the cipher text.
      var rawIV = rawCipherText.slice(0, 4);
      var rawCipherSalt = rawCipherText.slice(4, 8);
      var rawEncryptedText = rawCipherText.slice(8);

      // Expand the key into a cipher key using PBKDF2 with the given cipher salt.
      var rawCipherKey = sjcl.misc.pbkdf2(key, rawCipherSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);

      // SJCL doesn't know we are using HMAC-SHA256 to check integrity.
      // TODO: Consider using GCM mode to avoid implementation errors.
      sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

      // Initialize the AES algorithm with the cipher key.
      var cipher = new sjcl.cipher.aes(rawCipherKey);

      // Decrypt the blob data in CBC mode using AES and the given IV.
      var rawData = sjcl.mode.cbc.decrypt(cipher, rawEncryptedText, rawIV);
      var data = sjcl.codec.utf8String.fromBits(rawData);

      // Parse the decrypted data into a JSON object and set it as the blob's data.
      this.data = JSON.parse(data);
    };

    return DataBlob;
  })
;
