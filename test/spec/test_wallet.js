var sandbox = sinon.sandbox.create();

describe('Wallet', function () {
  afterEach(function(){
    sandbox.restore();
  });

  describe('constructor', function(){
    it('should use the supplied wallet options', function () {
      var walletOptions = {
        id:           1,
        key:          'key',
        recoveryId:   'recoveryId',
        recoveryData: {contents: 'recoveryData'},
        mainData:     {contents: 'mainData'},
        keychainData: {contents: 'keychainData'}
      };

      var wallet = new Wallet(walletOptions);

      expect(wallet.id).to.equal(walletOptions.id);
      expect(wallet.key).to.equal(walletOptions.key);
      expect(wallet.recoveryId).to.equal(walletOptions.recoveryId);
      expect(wallet.recoveryData).to.equal(walletOptions.recoveryData);
      expect(wallet.mainData).to.equal(walletOptions.mainData);
      expect(wallet.keychainData).to.equal(walletOptions.keychainData);
    });

    it('should use default wallet options', function () {
      var walletOptions = {
        id:           1,
        key:          'key',
        recoveryId:   'recoveryId'
      };

      var wallet = new Wallet(walletOptions);

      expect(wallet.id).to.equal(walletOptions.id);
      expect(wallet.key).to.equal(walletOptions.key);
      expect(wallet.recoveryId).to.equal(walletOptions.recoveryId);

      expect(wallet.keychainData).to.deep.equal({});
      expect(wallet.recoveryData).to.deep.equal({});
      expect(wallet.mainData).to.deep.equal({});
    });
  });

  describe('decrypt()', function(){
    beforeEach(function(){
      var decrypt = Wallet.decrypt;
      var decryptData = sandbox.stub(Wallet, 'decryptData');
      Wallet.decryptData.withArgs('encryptedMainData').returns('mainData');
      Wallet.decryptData.withArgs('encryptedRecoveryData').returns('recoveryData');
      Wallet.decryptData.withArgs('encryptedKeychainData').returns({authToken: 'authToken'});

      // Expose the required methods on the stubbed version of Wallet.
      sandbox.stub(window, 'Wallet');
      Wallet.decrypt = decrypt;
      Wallet.decryptData = decryptData;

      sandbox.stub(sjcl.codec.hex, 'toBits').returns([0, 1, 2, 3, 4, 5, 6, 7])
    });

    it('should decrypt an existing wallet', function(){
      var encryptedWallet = {
        id:               1,
        recoveryId:       'recoveryId',
        authToken:        'authToken',
        updateToken:      'updateToken',
        mainData:         'encryptedMainData',
        keychainData:     'encryptedKeychainData',
        recoveryData:     'encryptedRecoveryData'
      };

      var wallet = Wallet.decrypt(encryptedWallet, 1, 'key');

      expect(Wallet.decryptData.callCount).to.equal(3);
      expect(Wallet.called).to.equal(true);

      var options = Wallet.args[0][0];
      expect(options.id).to.equal(1);
      expect(options.key).to.equal('key');
      expect(options.recoveryId).to.equal('recoveryId');
      expect(options.mainData).to.equal('mainData');
      expect(options.recoveryData).to.equal('recoveryData');
      expect(options.keychainData).to.deep.equal({authToken: 'authToken'});
    });
  });

  describe('encrypt()', function(){
    var wallet;

    sandbox.stub(sjcl.codec.hex, 'toBits').returns([0, 1, 2, 3, 4, 5, 6, 7]);

    var walletOptions = {
      id:           1,
      key:          'key',
      recoveryId:   'recoveryId',
      recoveryData: {contents: 'recoveryData'},
      mainData:     {contents: 'mainData'},
      keychainData: {
        keys:        'signingKeys',
        authToken:   'authToken',
        updateToken: 'updateToken'
      }
    };

    beforeEach(function(){
      wallet = new Wallet(walletOptions);

      sandbox.stub(Wallet, 'encryptData');
      Wallet.encryptData.withArgs(walletOptions.recoveryData).returns('encryptedRecoveryData');
      Wallet.encryptData.withArgs(walletOptions.mainData).returns('encryptedMainData');
      Wallet.encryptData.withArgs(walletOptions.keychainData).returns('encryptedKeychainData');

      sandbox.stub(sjcl.hash.sha1, 'hash');
      sandbox.stub(sjcl.codec.hex, 'fromBits');
      sjcl.hash.sha1.hash.withArgs('encryptedRecoveryData').returns('encryptedRecoveryDataHash');
      sjcl.hash.sha1.hash.withArgs('encryptedMainData').returns('encryptedMainDataHash');
      sjcl.hash.sha1.hash.withArgs('encryptedKeychainData').returns('encryptedKeychainDataHash');
      sjcl.codec.hex.fromBits.withArgs('encryptedRecoveryDataHash').returns('encryptedRecoveryDataHashHex');
      sjcl.codec.hex.fromBits.withArgs('encryptedMainDataHash').returns('encryptedMainDataHashHex');
      sjcl.codec.hex.fromBits.withArgs('encryptedKeychainDataHash').returns('encryptedKeychainDataHashHex');
    });

    it('should encrypt the mainData, recoveryData, and keychainData', function(){
      var encryptedWallet = wallet.encrypt();

      expect(Wallet.encryptData.callCount).to.equal(3);
      expect(encryptedWallet.mainData).to.equal('encryptedMainData');
      expect(encryptedWallet.recoveryData).to.equal('encryptedRecoveryData');
      expect(encryptedWallet.keychainData).to.equal('encryptedKeychainData');
    });

    it('should hash the encrypted mainData, recoveryData, and keychainData', function(){
      var encryptedWallet = wallet.encrypt();

      expect(sjcl.hash.sha1.hash.callCount).to.equal(3);
      expect(encryptedWallet.mainDataHash).to.equal('encryptedMainDataHashHex');
      expect(encryptedWallet.recoveryDataHash).to.equal('encryptedRecoveryDataHashHex');
      expect(encryptedWallet.keychainDataHash).to.equal('encryptedKeychainDataHashHex');
    });

    it('should return the id, authToken, and recoveryId', function(){
      var encryptedWallet = wallet.encrypt();

      expect(encryptedWallet.id).to.equal(1);
      expect(encryptedWallet.authToken).to.equal('authToken');
      expect(encryptedWallet.recoveryId).to.equal('recoveryId');
    });
  });

  describe('encryptData', function(){
    it('should encrypt data', function(){
      var data = {content: 'test'};
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      var result = Wallet.encryptData(data, key);

      expect(result.length).to.equal(156);
      var resultObject = JSON.parse(atob(result));
      expect(resultObject.cipherName).to.equal('aes');
      expect(resultObject.mode).to.equal('ccm');
      expect(resultObject.cipherText.length).to.equal(36);
    });
  });

  describe('decryptData', function(){
    it('should decrypt data', function(){
      var encryptedData = "eyJJViI6IkVoOVFnQVNnQS8wYStLdXdtNGpjT1E9PSIsImNpcGhlclRleHQiOiI4dlFOZE5nV1VZcHUxajV2ZmkrRUV5UUJ0cnUyUnhWUVF6RT0iLCJjaXBoZXJOYW1lIjoiYWVzIiwibW9kZSI6ImNjbSJ9";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      var result = Wallet.decryptData(encryptedData, key);

      expect(result).to.deep.equal({content: 'test'});
    });

    it('should throw an error if the encryptedData was corrupted', function(){
      var corruptedData = "eyJJViI6IkVoOVFnQVNnQS8wYStLdXdtNGpjT1E9PSIsImNpcGhlclRleHQiOiI4dlFOZE5nV1VZcHUxajV2ZmkrRUV5UUJ0cnUyUnhWUVF6RT0iLCJjaXBoZXJOYW";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      expect(function(){
        var result = Wallet.decryptData(corruptedData, key);
      }).to.throw('Data corrupt!');
    });

    it('should throw an error if the cipherText has been modified', function(){
      var corruptedData = "eyJJViI6IkVoOVFnQVNnQS8wYStLdXdtNGpjT1E9PSIsImNpcGhlclRleHQiOiI4dlFOZE5nV1VZcHUxajV2ZmkrRUF5UUJ0cnUyUnhWUVF6RT0iLCJjaXBoZXJOYW1lIjoiYWVzIiwibW9kZSI6ImNjbSJ9";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      expect(function(){
        var result = Wallet.decryptData(corruptedData, key);
      }).to.throw('ccm: tag doesn\'t match');
    });
  });
});