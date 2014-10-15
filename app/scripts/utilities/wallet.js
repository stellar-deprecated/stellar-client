angular.module('stellarClient').factory('Wallet', function($q, $http, ipCookie) {

  var SWALLOWED_SECURITY_ERRORS = _([
    'SecurityError',
    'QuotaExceededError'
  ]);

  /**
   * The Wallet class provides functionality for interacting with the stellar-wallet
   * service.  It provides the means to create and sync an encrypted wallet blob
   * with the service, as well as the logic to encrypt and decrypt the data
   * returned by the service.
   * 
   * @namespace Wallet
   * @class
   */
  var Wallet = function(options){
    this.id = options.id;
    this.key = options.key;

    this.version = options.version || 1;
    this.keychainData = options.keychainData || {};
    this.mainData = options.mainData || {};

    if (this.version === 2) {
      // This is Wallet object from stellar-wallet-js-sdk:
      // https://github.com/stellar/stellar-wallet-js-sdk#wallet-object
      this.walletV2 = options.walletV2;
      if (_.isString(this.mainData)) {
        this.mainData = JSON.parse(this.mainData);
      }
      if (_.isString(this.keychainData)) {
        this.keychainData = JSON.parse(this.keychainData);
      }
    }

    // HACK: Remove old contact lists to reduce the wallet size.
    // TODO: Remove this if we need to store contacts in the wallet.
    if(this.mainData.contacts) {
      delete this.mainData.contacts;
    }
    if(this.mainData.stellar_contact) {
      delete this.mainData.stellar_contact;
    }
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
   * @memberOf Wallet
   * @static
   */
  Wallet.decrypt = function(encryptedWallet, id, key){
    var rawKey = sjcl.codec.hex.toBits(key);

    var keychainData = Wallet.decryptData(encryptedWallet.keychainData, rawKey);
    var mainData;
    try {
      mainData = Wallet.decryptData(encryptedWallet.mainData, rawKey);
    } catch(err) {
      // If the mainData get corrupted, reset it.
      // https://github.com/stellar/stellar-client/issues/566
      mainData = {};
    }

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
   * @param {string} userRecoveryCode
   * @param {string} serverRecoveryCode
   *
   * @returns {Wallet}
   * @memberOf Wallet
   * @static
   */
  Wallet.recover = function(encryptedWallet, recoveryId, userRecoveryCode, serverRecoveryCode){
    var recoveryKey, recoveryData;

    try {
      recoveryKey = Wallet.deriveKey(recoveryId, userRecoveryCode, serverRecoveryCode);
      var rawRecoveryKey = sjcl.codec.hex.toBits(recoveryKey);
      recoveryData = Wallet.decryptData(encryptedWallet.recoveryData, rawRecoveryKey);
    } catch(err) {
      // The recovery key was invalid. Try using the broken deriveKey function.
      var brokenRecoveryKey = Wallet.deriveKeyBroken(recoveryId, userRecoveryCode, serverRecoveryCode);
      var rawBrokenRecoveryKey = sjcl.codec.hex.toBits(brokenRecoveryKey);
      recoveryData = Wallet.decryptData(encryptedWallet.recoveryData, rawBrokenRecoveryKey);
      // TODO: Encrypt the recovery data with the new key and update it.
    }

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
    };

    var loadFromLocal = function() {
      var encryptedWallet            = localStorage.wallet;
      var localWalletKey             = ipCookie("localWalletKey");
      var encryptedWalletKey         = localStorage.encryptedWalletKey;
      var canAttemptLocalStorageLoad = encryptedWallet && localWalletKey && encryptedWalletKey;

      if (!canAttemptLocalStorageLoad) { return; }

      var decryptedWalletKey = Wallet.decryptData(encryptedWalletKey, localWalletKey);
      var decryptedWallet    = Wallet.decryptData(encryptedWallet, sjcl.codec.hex.toBits(decryptedWalletKey));

      return new Wallet(decryptedWallet);
    };

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
   * Abstracts access to the wallet's data sources.
   * Throws an error if the data source is not defined.
   *
   * @param {string} dataSource The name of the dataSource to resolve.
   *
   * @return {object} The data source.
   * @memberOf Wallet
   * @private
   */
  Wallet.prototype._getDataSource = function(dataSource) {
    if(!_.has(this, dataSource)) {
      throw 'Invalid data source. No property ' + dataSource + ' found.';
    } else {
      return this[dataSource];
    }
  };

  /**
   * Gets a property from one of the wallet's data sources.
   *
   * @param {string} dataSource The name of the dataSource to use.
   * @param {string} propertyName The name of the property to get.
   * @param {*} [defaultValue] The value to return if the property is not defined.
   *
   * @return {*} The property or default value.
   * @memberOf Wallet
   */
  Wallet.prototype.get = function(dataSource, propertyName, defaultValue) {
    var data = this._getDataSource(dataSource);
    return _.has(data, propertyName) ? data[propertyName] : defaultValue;
  };

  /**
   * Sets a property on one of the wallet's data sources.
   *
   * @param {string} dataSource The name of the dataSource to use.
   * @param {string} propertyName The name of the property to get.
   * @param {*} value The value to set.
   *
   * @return {Wallet} This wallet.
   * @memberOf Wallet
   */
  Wallet.prototype.set = function(dataSource, propertyName, value) {
    var data = this._getDataSource(dataSource);
    data[propertyName] = value;
    return this;
  };

  Wallet.prototype.storeRecoveryData = function (userRecoveryCode, serverRecoveryCode) {
    var recoveryId = Wallet.deriveId(userRecoveryCode, serverRecoveryCode);
    var recoveryKey = Wallet.deriveKey(recoveryId, userRecoveryCode, serverRecoveryCode);

    var data = this.createRecoveryData(recoveryId, recoveryKey);

    return $http.post(Options.WALLET_SERVER + '/wallets/create_recovery_data', data);
  };

  /**
   * Encrypts the wallet's id and key into the recoveryData and sets its the recoveryId.
   *
   * @param {string} recoveryId
   * @param {string} recoveryKey
   * @memberOf Wallet
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
    };
  };

  /**
   * Encrypts the wallet data into a generic object.
   *
   * @returns {object}
   * @memberOf Wallet
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

  /**
   * Encrypts and saves the wallet to the server.
   *
   * @param {string} action Server expects 'create' or 'update'.
   *
   * returns {Promise}
   * @memberOf Wallet
   */
  Wallet.prototype.sync = function(action) {
    if (this.version == 2) {
      if (action == 'update') {
        //
      } else if (action == 'create') {
        //
      }
    } else {
      var url = Options.WALLET_SERVER + '/wallets/' + action;
      var data = this.encrypt();
      return $http.post(url, data);
    }
  };

  Wallet.prototype.saveLocal = function() {
    var self = this;

    Util.ensureEntropy();
    var loginWalletKey = sjcl.random.randomWords(Wallet.SETTINGS.KEY_SIZE / 4);
    var encryptedWalletKey = Wallet.encryptData(this.key, loginWalletKey);

    catchAndSwallowSecurityErrors(function() {
      ipCookie("localWalletKey", loginWalletKey, {expires: self.getIdleLogoutTime()/1000, expirationUnit: 'seconds', secure: Options.COOKIE_SECURE});
      localStorage.encryptedWalletKey = encryptedWalletKey;
      localStorage.wallet             = Wallet.encryptData(self, sjcl.codec.hex.toBits(self.key));
      sessionStorage.wallet           = JSON.stringify(self);
    });
  };


  Wallet.prototype.bumpLocalTimeout = function() {
    var self = this;

    //TODO: push the cookie timeout forward
    catchAndSwallowSecurityErrors(function() {
      ipCookie("localWalletKey", ipCookie("localWalletKey"), {expires: self.getIdleLogoutTime()/1000, expirationUnit: 'seconds', secure: Options.COOKIE_SECURE});
    });
  };

  Wallet.prototype.getIdleLogoutTime = function() {
    return this.get('mainData', 'idleLogoutTime', Options.DEFAULT_IDLE_LOGOUT_TIMEOUT || 15 * 60 * 1000);
  };

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
    MODE: 'gcm',
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
   * @memberOf Wallet
   */
  Wallet.deriveId = function(username, password) {
    var deferred = $q.defer();

    setTimeout(function() {
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

      deferred.resolve(sjcl.codec.hex.fromBits(id));
    }, 0);

    return deferred.promise;
  };

  Wallet.deriveKey = function(id, username, password){
    var credentials = id + username.toLowerCase() + password;
    var salt = sjcl.codec.utf8String.toBits(credentials);

    var key = sjcl.misc.scrypt(
      credentials,
      salt,
      Wallet.SETTINGS.SCRYPT.N,
      Wallet.SETTINGS.SCRYPT.r,
      Wallet.SETTINGS.SCRYPT.p,
      Wallet.SETTINGS.SCRYPT.SIZE/8
    );

    return sjcl.codec.hex.fromBits(key);
  };

  /**
   * This is the old version of deriveKey that is broken, because it concatenates
   * a string with an array for the salt parameter.
   * 
   * @memberOf Wallet
   */
  Wallet.deriveKeyBroken = function(id, username, password){
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

  /**
   * Handles opening an encrypted wallet and migrating to the new deriveKey function.
   *
   * @param {object} encryptedWallet
   * @param {string} id
   * @param {string} username
   * @param {string} password
   *
   * @return {Promise}
   * @memberOf Wallet
   * @static
   */
  Wallet.open = function(encryptedWallet, id, username, password){
    var deferred = $q.defer();

    var key, wallet;

    try {
      key = Wallet.deriveKey(id, username, password);
      wallet = Wallet.decrypt(encryptedWallet, id, key);
      deferred.resolve(wallet);
    } catch (err) {
      try {
        // The key was invalid. Try using the broken deriveKey function.
        var brokenKey = Wallet.deriveKeyBroken(id, username, password);
        wallet = Wallet.decrypt(encryptedWallet, id, brokenKey);

        var newWallet = new Wallet({
          id: id,
          key: key,
          keychainData: wallet.keychainData,
          mainData: wallet.mainData
          // TODO: Copy recovery data.
        });

        newWallet.sync('update')
          .then(function() {
            deferred.resolve(newWallet);
          });
      } catch (err) {
        deferred.reject(err);
      }
    }

    return deferred.promise
      .then(function(wallet) {
        return fixMissingUsername(wallet, username);
      })
      .then(enforceCorrectAddress);
  };

  /**
   * A small number of wallets had their mainData truncated, and when it was rebuilt
   * the username was missing, because it was only added during registration.
   * Update mainData with the username used at login if it is missing.
   * https://github.com/stellar/stellar-client/issues/594
   */
  function fixMissingUsername(wallet, username) {
    if(!wallet.mainData.username) {
      wallet.mainData.username = username;
    }

    return $q.when(wallet);
  }

  /**
   * A small number of wallets got into a state where the stored address did
   * not match the address generated by the stored secret, which prevented
   * them from signing transactions.
   * https://github.com/stellar/stellar-client/issues/576
   */
  function enforceCorrectAddress(wallet) {
    var signingKeys = wallet.keychainData.signingKeys;
    var storedAddress = signingKeys.address;
    var seed = stellar.Seed.from_json(signingKeys.secret);
    var key = seed.get_key();
    var computedAddress = key.get_address().to_json();

    if(storedAddress !== computedAddress) {
      wallet.keychainData.signingKeys.address = computedAddress;
      wallet.sync('update');
    }

    return $q.when(wallet);
  }

  /**
   * Encrypt data using 256bit AES in CCM mode with HMAC-SHA256 integrity checking.
   *
   * @param {object} data The data to encrypt.
   * @param {Array.<bits>} key The key used to encrypt the data.
   *
   * @return {string} The encrypted data encoded as base64.
   * @memberOf Wallet
   * @static
   */
  Wallet.encryptData = function(data, key) {
    // Encode data into a JSON byte array.
    var rawData = sjcl.codec.utf8String.toBits(JSON.stringify(data));

    // Initialize the cipher algorithm with the key.
    var cipher = new sjcl.cipher[Wallet.SETTINGS.CIPHER_NAME](key);

    // Encrypt the blob data in CCM mode using AES and a random 96bit IV.
    Util.ensureEntropy();
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
   * @memberOf Wallet
   * @static
   */
  Wallet.decryptData = function(encryptedData, key) {
    var rawCipherText, rawIV, cipherName, mode;

    try {
      // Parse the base64 encoded JSON object.
      var resultObject = JSON.parse(atob(encryptedData));

      // Extract the cipher text from the encrypted data.
      rawCipherText = sjcl.codec.base64.toBits(resultObject.cipherText);

      // Extract the cipher text from the encrypted data.
      rawIV = sjcl.codec.base64.toBits(resultObject.IV);

      // Extract the cipher name from the encrypted data.
      cipherName = resultObject.cipherName;
      mode = resultObject.mode;
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

  function catchAndSwallowSecurityErrors(fn) {
    try {
      return fn();
    } catch(err) {
      var shouldSwallow = false;

      if(SWALLOWED_SECURITY_ERRORS.contains(err.name)) {
        shouldSwallow = true;
      }

      if(err.message === "Access is denied.") {
        shouldSwallow = true;
      }

      if(shouldSwallow) {
        return;
      }  else {
        throw err;
      }
    }
  }

  return Wallet;
});


