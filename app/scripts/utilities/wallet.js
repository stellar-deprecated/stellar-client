var Wallet = function(options){
  this.id = options.id;
  this.key = options.key;
  this.recoveryId = options.recoveryId;
  this.keychainData = options.keychainData;

  this.mainData = options.mainData || {};
  this.recoveryData = options.recoveryData || {};
};

/**
 * Create a wallet containing blobs of encrypted data.
 *
 * @param {string} username
 * @param {string} password
 * @param {string} recoveryId
 * @param {string} authToken
 * @param {string} updateToken
 *
 * @returns {Wallet}
 */
Wallet.create = function(username, password, authToken, updateToken, recoveryId){
  var expandedCredentials = Wallet.expandCredentials(username, password);

  var options = {
    id:         expandedCredentials.id,
    key:        expandedCredentials.key,
    recoveryId: recoveryId,
    keychainData: {
      signingKeys: SigningKeys.generate(),
      authToken:   authToken,
      updateToken: updateToken
    }
  };

  return new Wallet(options);
};

/**
 * Create a wallet containing blobs of encrypted data.
 *
 * @param {object} encryptedWallet
 * @param {string} encryptedWallet.id
 * @param {string} encryptedWallet.recoveryId
 * @param {string} encryptedWallet.authToken
 * @param {string} encryptedWallet.updateToken
 * @param {string} encryptedWallet.mainData
 * @param {string} encryptedWallet.mainDataHash
 * @param {string} encryptedWallet.keychainData
 * @param {string} encryptedWallet.keychainDataHash
 * @param {string} encryptedWallet.recoveryData
 * @param {string} encryptedWallet.recoveryDataHash
 * @param {Array.<bits>} key
 *
 * @returns {Wallet}
 */
Wallet.decrypt = function(encryptedWallet, key){
  if (!Wallet.checkHash(encryptedWallet.mainData, encryptedWallet.mainDataHash)){
    throw new Error('Incorrect hash for mainData.');
  }

  if (!Wallet.checkHash(encryptedWallet.recoveryData, encryptedWallet.recoveryDataHash)){
    throw new Error('Incorrect hash for recoveryData.');
  }

  if (!Wallet.checkHash(encryptedWallet.keychainData, encryptedWallet.keychainDataHash)){
    throw new Error('Incorrect hash for keychainData.');
  }

  var mainData = Wallet.decryptData(encryptedWallet.mainData, key);
  var recoveryData = Wallet.decryptData(encryptedWallet.recoveryData, key);
  var keychainData = Wallet.decryptData(encryptedWallet.keychainData, key);

  // Unpack the signing key strings into objects that can be used for signing.
  keychainData.signingKeys = SigningKeys.unpack(keychainData.signingKeys);

  var options = {
    id:           encryptedWallet.id,
    key:          key,
    recoveryId:   encryptedWallet.recoveryId,
    recoveryData: recoveryData,
    mainData:     mainData,
    keychainData: keychainData
  };

  return new Wallet(options);
};

Wallet.prototype.encrypt = function(){
  var keychainData = {
    // Signing keys must be packed as strings before encryption.
    keys:        this.keychainData.keys.pack(),
    authToken:   this.keychainData.authToken,
    updateToken: this.keychainData.updateToken
  };

  var encryptedMainData = Wallet.encryptData(this.mainData, this.key);
  var encryptedRecoveryData = Wallet.encryptData(this.recoveryData, this.key);
  var encryptedKeychainData = Wallet.encryptData(keychainData, this.key);

  return {
    id:               this.id,
    authToken:        this.keychainData.authToken,
    recoveryId:       this.recoveryId,
    mainData:         encryptedMainData,
    mainDataHash:     sjcl.hash.sha1.hash(encryptedMainData),
    keychainData:     encryptedKeychainData,
    keychainDataHash: sjcl.hash.sha1.hash(encryptedKeychainData),
    recoveryData:     encryptedRecoveryData,
    recoveryDataHash: sjcl.hash.sha1.hash(encryptedRecoveryData)
  };
};

Wallet.expandCredentials = function(username, password){
  var expandedCredentials = {};

  // TODO: Expand username + password into key.
  expandedCredentials.key = [0, 0, 0, 0, 0, 0, 0, 0];

  // TODO: Expand walletKey into id.
  expandedCredentials.id = '';

  return expandedCredentials;
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

/**
 * Configure the data cryptography setting.
 */
var settings = {
  pbkdf2: {
    iterations: 1000,
    size: 256 // Must be a valid AES key size.
  }
};

/**
 * Encrypt data using 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
 *
 * @param {object} data The data to encrypt.
 * @param {Array.<bits>} key The key used to encrypt the data.
 *
 * @return {string} The encrypted data encoded as base64.
 */
Wallet.encryptData = function(data, key) {
  // Encode data into a JSON byte array.
  var rawData = sjcl.codec.utf8String.toBits(JSON.stringify(data));

  // Initialize the AES algorithm with the cipher key.
  var cipher = new sjcl.cipher.aes(key);

  // SJCL doesn't know we are using HMAC-SHA256 to check integrity.
  // TODO: Consider using GCM mode to avoid implementation errors.
  sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

  // Encrypt the blob data in CBC mode using AES and a random 128bit IV.
  var rawIV = sjcl.random.randomWords(4);
  var rawEncryptedText = sjcl.mode.cbc.encrypt(cipher, rawData, rawIV);

  // Concatenate the IV and encrypted blob data respectively into the cipher text.
  var rawCipherText = rawIV.concat(rawEncryptedText);
  var cipherText = bitsToString(rawCipherText);

  // Expand the key into a randomly salted hash key using PBKDF2.
  var rawHashSalt = sjcl.random.randomWords(4);
  var rawHashKey = sjcl.misc.pbkdf2(key, rawHashSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);
  var hashKey = bitsToString(rawHashKey);

  // Calculate the authentication hash of the cipher text using HMAC-SHA256.
  var rawHash = CryptoJS.HmacSHA256(cipherText, hashKey).words;

  // Encrypted data structure:
  //  ------------------------------------- -------------------------------
  // |        HMAC-SHA256(cipherText)      |           cipherText          |
  // |-------------------------------------|-------------------------------|
  // | hash (8 bytes) | hashSalt (4 bytes) | IV (4 bytes) | data (n bytes) |
  //  ------------------------------------- -------------------------------
  var rawEncryptedData = rawHash.concat(rawHashSalt, rawCipherText);
  return sjcl.codec.base64.fromBits(rawEncryptedData);
};

/**
 * Decrypt data using 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
 *
 * @param {string} encryptedData The encrypted data encoded as base64.
 * @param {string | Array.<bits>} key The key used to decrypt the blob.
 */
Wallet.decryptData = function(encryptedData, key) {
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

  // Extract the IV and encrypted data from the cipher text.
  var rawIV = rawCipherText.slice(0, 4);
  var rawEncryptedText = rawCipherText.slice(4);

  // SJCL doesn't know we are using HMAC-SHA256 to check integrity.
  // TODO: Consider using GCM mode to avoid implementation errors.
  sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

  // Initialize the AES algorithm with the cipher key.
  var cipher = new sjcl.cipher.aes(key);

  // Decrypt the data in CBC mode using AES and the given IV.
  var rawData = sjcl.mode.cbc.decrypt(cipher, rawEncryptedText, rawIV);
  var data = sjcl.codec.utf8String.fromBits(rawData);

  // Parse and return the decrypted data as a JSON object.
  return JSON.parse(data);
};

Wallet.checkHash = function(data, expectedHash) {
  return sjcl.hash.sha1.hash(data) === expectedHash;
};