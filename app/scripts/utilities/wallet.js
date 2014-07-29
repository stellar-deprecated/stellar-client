angular.module('stellarClient').factory('Wallet', function(ipCookie) {
angular.module('stellarClient').factory('Wallet', function($q, $http, ipCookie) {
  var Wallet = function(options){
    this.id = options.id;
    this.key = options.key;

    this.keychainData = options.keychainData || {};
    this.mainData = options.mainData || {};
  };

  /**
   * Decrypts an encrypted wallet.
   *
   * @param {object} encryptedWallet
   * @param {string} encryptedWallet.id
   * @param {string} encryptedWallet.mainData
   * @param {string} encryptedWallet.keychainData
   * @param {string} id
   * @param {string} key
   *
   * @returns {Wallet}
   */
  Wallet.decrypt = function(encryptedWallet, id, key){
    var rawKey = sjcl.codec.hex.toBits(key);

    var mainData = Wallet.decryptData(encryptedWallet.mainData, rawKey);
    var keychainData = Wallet.decryptData(encryptedWallet.keychainData, rawKey);

    var options = {
      id:           id,
      key:          key,
      mainData:     mainData,
      keychainData: keychainData
    };

    return new Wallet(options);
  };

  /**
   * Decrypts a wallet using the recovery data.
   *
   * @param {object} encryptedWallet
   * @param {string} encryptedWallet.id
   * @param {string} encryptedWallet.recoveryId
   * @param {string} encryptedWallet.mainData
   * @param {string} encryptedWallet.keychainData
   * @param {string} encryptedWallet.recoveryData
   * @param {string} recoveryId
   * @param {string} recoveryKey
   *
   * @returns {Wallet}
   */
  Wallet.recover = function(encryptedWallet, recoveryId, recoveryKey){
    var rawRecoveryKey = sjcl.codec.hex.toBits(recoveryKey);
    var recoveryData = Wallet.decryptData(encryptedWallet.recoveryData, rawRecoveryKey);

    var wallet = Wallet.decrypt(encryptedWallet, recoveryData.id, recoveryData.key);
    wallet.recoveryId = recoveryId;
    wallet.recoveryKey = recoveryKey;

    return wallet;
  };

  Wallet.loadLocal = function() {

    var loadFromSession = function() {
      var unparsedWallet = sessionStorage.wallet;
      if (!unparsedWallet) {
        return;
      }

      var parsed = null;

      try {
        parsed = JSON.parse(sessionStorage.wallet);
      } catch(e) {
        return;
      }

      return new Wallet(parsed);
    }

    var loadFromLocal = function() {
      var encryptedWallet            = localStorage.wallet;
      var localWalletKey             = ipCookie("localWalletKey");
      var encryptedWalletKey         = localStorage.encryptedWalletKey;
      var canAttemptLocalStorageLoad = encryptedWallet && localWalletKey && encryptedWallet;

      if (!canAttemptLocalStorageLoad) { return; }

      var decryptedWalletKey = Wallet.decryptData(encryptedWalletKey, localWalletKey);
      var decryptedWallet    = Wallet.decryptData(encryptedWallet, sjcl.codec.hex.toBits(decryptedWalletKey));

      return new Wallet(decryptedWallet);
    }

    return catchAndSwallowSecurityErrors(function() {
      return loadFromSession() || loadFromLocal();
    });
  };

  Wallet.purgeLocal = function() {
    catchAndSwallowSecurityErrors(function() {
      ipCookie.remove("localWalletKey");
      delete sessionStorage.wallet;
      delete localStorage.encryptedWalletKey;
      delete localStorage.wallet;
    });
  };

  /**
   * Encrypts the wallet's id and key into the recoveryData and sets its the recoveryId.
   *
   * @param {string} recoveryId
   * @param {string} recoveryKey
   */
  Wallet.prototype.createRecoveryData = function(recoveryId, recoveryKey){
    var rawRecoveryKey = sjcl.codec.hex.toBits(recoveryKey);
    var recoveryData = Wallet.encryptData({id: this.id, key: this.key}, rawRecoveryKey);

    return {
      id: this.id,
      authToken: this.keychainData.authToken,
      recoveryId: recoveryId,
      recoveryData: recoveryData,
      recoveryDataHash: sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(recoveryData))
    }
  };

  /**
   * Encrypts the wallet data into a generic object.
   *
   * @returns {object}
   */
  Wallet.prototype.encrypt = function(){
    var rawKey = sjcl.codec.hex.toBits(this.key);

    var encryptedMainData = Wallet.encryptData(this.mainData, rawKey);
    var encryptedKeychainData = Wallet.encryptData(this.keychainData, rawKey);

    return {
      id:               this.id,
      authToken:        this.keychainData.authToken,
      mainData:         encryptedMainData,
      mainDataHash:     sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(encryptedMainData)),
      keychainData:     encryptedKeychainData,
      keychainDataHash: sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(encryptedKeychainData))
    };
  };


  Wallet.prototype.saveLocal = function() {
    var self = this;
    var loginWalletKey = sjcl.random.randomWords(Wallet.SETTINGS.KEY_SIZE / 4);
    var encryptedWalletKey = Wallet.encryptData(this.key, loginWalletKey);

    catchAndSwallowSecurityErrors(function() {
      ipCookie("localWalletKey", loginWalletKey, {expires:Options.IDLE_LOGOUT_TIMEOUT, expirationUnit:'seconds'});
      localStorage.encryptedWalletKey = encryptedWalletKey;
      localStorage.wallet             = Wallet.encryptData(self, sjcl.codec.hex.toBits(self.key));
      sessionStorage.wallet           = JSON.stringify(self);
    });
  };


  Wallet.prototype.bumpLocalTimeout = function() {
    //TODO: push the cookie timeout foreward
    catchAndSwallowSecurityErrors(function() {
      ipCookie("localWalletKey", ipCookie("localWalletKey"), {expires:Options.IDLE_LOGOUT_TIMEOUT, expirationUnit:'seconds'});
    });
  }

  /**
   * Configure the data cryptography setting.
   */
  Wallet.SETTINGS = {
    PBKDF2: {
      ITERATIONS: 1000,
      SIZE: 256 // Must be a valid AES key size.
    },

    SCRYPT: {
      N: Math.pow(2, 11),
      r: 8,
      p: 1,
      SIZE: 256
    },

    CIPHER_NAME: 'aes',
    MODE: 'ccm',
    KEY_SIZE: 32
  };

  /**
   * Expand a username and password into an id and key using sjcl-scrypt.
   * Since the results must be deterministic, the credentials are used for the salt.
   *
   * id = scrypt(username + password)
   * key = scrypt(scrypt(username + password) + username + password)
   *
   * @param username
   * @param password
   * @returns {
   *   {
   *     id: {string},
   *     key: {string}
   *   }
   * }
   */

  Wallet.deriveId = function(username, password){
    var credentials = username.toLowerCase() + password;
    var salt = sjcl.codec.utf8String.toBits(credentials);

    var id = sjcl.misc.scrypt(
      credentials,
      salt,
      Wallet.SETTINGS.SCRYPT.N,
      Wallet.SETTINGS.SCRYPT.r,
      Wallet.SETTINGS.SCRYPT.p,
      Wallet.SETTINGS.SCRYPT.SIZE/8
    );

    return sjcl.codec.hex.fromBits(id);
  };

  Wallet.deriveKey = function(id, username, password){
    var credentials = username.toLowerCase() + password;
    var salt = sjcl.codec.utf8String.toBits(credentials);

    var key = sjcl.misc.scrypt(
      id + credentials,
      id + salt,
      Wallet.SETTINGS.SCRYPT.N,
      Wallet.SETTINGS.SCRYPT.r,
      Wallet.SETTINGS.SCRYPT.p,
      Wallet.SETTINGS.SCRYPT.SIZE/8
    );

    return sjcl.codec.hex.fromBits(key);
  };

  Wallet.prototype.sync = function(action) {
    var url = Options.WALLET_SERVER + '/wallets/' + action;
    var data = this.encrypt();

    return $http.post(url, data)
      .success(function (response) {
        if (Options.PERSISTENT_SESSION) {
          this.saveLocal();
        }
      });
  };

  /**
   * Encrypt data using 256bit AES in CCM mode with HMAC-SHA256 integrity checking.
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
    var cipher = new sjcl.cipher[Wallet.SETTINGS.CIPHER_NAME](key);

    // Encrypt the blob data in CCM mode using AES and a random 96bit IV.
    var rawIV = sjcl.random.randomWords(3);
    var rawCipherText = sjcl.mode[Wallet.SETTINGS.MODE].encrypt(cipher, rawData, rawIV);

    // Base 64 encode.
    var IV = sjcl.codec.base64.fromBits(rawIV);
    var cipherText = sjcl.codec.base64.fromBits(rawCipherText);

    // Pack the results into a JSON encoded string.
    var resultString = JSON.stringify({
      IV: IV,
      cipherText: cipherText,
      cipherName: Wallet.SETTINGS.CIPHER_NAME,
      mode: Wallet.SETTINGS.MODE
    });

    // Encode the JSON string as base64 to obscure it's structure.
    return btoa(resultString);
  };

  /**
   * Decrypt data using 256bit AES in CCM mode with HMAC-SHA256 integrity checking.
   *
   * @param {string} encryptedData The encrypted data encoded as base64.
   * @param {Array.<bits>} key The key used to decrypt the blob.
   */
  Wallet.decryptData = function(encryptedData, key) {
    try {
      // Parse the base64 encoded JSON object.
      var resultObject = JSON.parse(atob(encryptedData));

      // Extract the cipher text from the encrypted data.
      var rawCipherText = sjcl.codec.base64.toBits(resultObject.cipherText);

      // Extract the cipher text from the encrypted data.
      var rawIV = sjcl.codec.base64.toBits(resultObject.IV);

      // Extract the cipher name from the encrypted data.
      var cipherName = resultObject.cipherName;
      var mode = resultObject.mode;
    } catch(e) {
      // The encoded data does not represent valid base64 values.
      throw('Data corrupt!');
    }

    // Initialize the cipher algorithm with the key.
    var cipher = new sjcl.cipher[cipherName](key);

    // Decrypt the data in CCM mode using AES and the given IV.
    var rawData = sjcl.mode[mode].decrypt(cipher, rawCipherText, rawIV);
    var data = sjcl.codec.utf8String.fromBits(rawData);

    // Parse and return the decrypted data as a JSON object.
    return JSON.parse(data);
  };

  return Wallet;
});

function catchAndSwallowSecurityErrors(fn) {
  try {
    return fn();
  } catch(err) {
    // Safari throws this exception when interacting with localstorage
    // if the current user has their privacy settings set to reject cookies
    // and other data.  We swallow it silently.
    if(err.name == "SecurityError"){ 
      return; 
    } else {
      throw err;
    }
  }
}

