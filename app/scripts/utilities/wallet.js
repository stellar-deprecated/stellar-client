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

/**
 * Configure the data cryptography setting.
 */
var settings = {
  pbkdf2: {
    iterations: 1000,
    size: 256 // Must be a valid AES key size.
  },

  scrypt: {
    N: Math.pow(2, 11),
    r: 8,
    p: 1,
    size: 256
  },

  cipherName: 'aes'
};

Wallet.expandCredentials = function(username, password){
  var credentials = username + password;
  var salt = credentials;

  console.time('Generating ID');
  var id = sjcl.misc.scrypt(credentials, salt, settings.scrypt.N, settings.scrypt.r, settings.scrypt.p, settings.scrypt.size/8);
  id = sjcl.codec.base64.fromBits(id);
  console.timeEnd('Generating ID');

  console.time('Generating key');
  var key = sjcl.misc.scrypt(id + credentials, id + salt, settings.scrypt.N, settings.scrypt.r, settings.scrypt.p, settings.scrypt.size/8);
  console.timeEnd('Generating key');

  return {
    id: id,
    key: key
  };
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

  // Initialize the cipher algorithm with the key.
  var cipher = new sjcl.cipher[settings.cipherName](key);

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

  // Pack the results into a JSON encoded string.
  var resultString = JSON.stringify({
    hash: sjcl.codec.base64.fromBits(rawHash),
    hashSalt: sjcl.codec.base64.fromBits(rawHashSalt),
    cipherText: sjcl.codec.base64.fromBits(rawCipherText),
    cipherName: settings.cipherName
  });

  // Encode the JSON string as base64 to obscure it's structure.
  return btoa(resultString);
};

/**
 * Decrypt data using 256bit AES in CBC mode with HMAC-SHA256 integrity checking.
 *
 * @param {string} encryptedData The encrypted data encoded as base64.
 * @param {string | Array.<bits>} key The key used to decrypt the blob.
 */
Wallet.decryptData = function(encryptedData, key) {
  try {
    // Parse the base64 encoded JSON object.
    var resultObject = JSON.parse(atob(encryptedData));

    // Extract the authentication hash and hash salt from the encrypted data.
    var rawGivenHash = sjcl.codec.base64.toBits(resultObject.hash);
    var rawHashSalt = sjcl.codec.base64.toBits(resultObject.hashSalt);

    // Extract the cipher text from the encrypted data.
    var rawCipherText = sjcl.codec.base64.toBits(resultObject.cipherText);
    var cipherText = bitsToString(rawCipherText);

    // Extract the cipher name from the encrypted data.
    var cipherName = resultObject.cipherName;
  } catch(e) {
    // The encoded data does not represent valid base64 values.
    throw('Data corrupt!');
  }

  // Expand the key into a hash key using PBKDF2 with the given hash salt.
  var rawHashKey = sjcl.misc.pbkdf2(key, rawHashSalt, settings.pbkdf2.iterations, settings.pbkdf2.size);
  var hashKey = bitsToString(rawHashKey);

  // Calculate the authentication hash of the cipher text using HMAC-SHA256.
  var rawCalculatedHash = CryptoJS.HmacSHA256(cipherText, hashKey).words;
  var calculatedHash = bitsToString(rawCalculatedHash);

  // Ensure that the given cipher text hash matches the calculated cipher text hash.
  var givenHash = bitsToString(rawGivenHash);
  if(givenHash !== calculatedHash) throw("Message integrity check failed!");

  // Extract the IV and encrypted data from the cipher text.
  var rawIV = rawCipherText.slice(0, 4);
  var rawEncryptedText = rawCipherText.slice(4);

  // SJCL doesn't know we are using HMAC-SHA256 to check integrity.
  // TODO: Consider using GCM mode to avoid implementation errors.
  sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

  // Initialize the cipher algorithm with the key.
  var cipher = new sjcl.cipher[cipherName](key);

  // Decrypt the data in CBC mode using AES and the given IV.
  var rawData = sjcl.mode.cbc.decrypt(cipher, rawEncryptedText, rawIV);
  var data = sjcl.codec.utf8String.fromBits(rawData);

  // Parse and return the decrypted data as a JSON object.
  return JSON.parse(data);
};

Wallet.checkHash = function(data, expectedHash) {
  return sjcl.hash.sha1.hash(data) === expectedHash;
};