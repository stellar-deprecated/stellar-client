var sandbox = sinon.sandbox.create();

describe('Wallet', function () {
  beforeEach(function(){
    sandbox.stub(Wallet, 'expandCredentials').returns({id: 1, key: [1, 2, 3, 4, 5, 6, 7, 8]});
  });

  afterEach(function(){
    sandbox.restore();
  });

  describe('constructor', function(){
    it('should use the supplied wallet options', function () {
      var walletOptions = {
        id:           1,
        key:          [1, 2, 3, 4, 5, 6, 7, 8],
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
        key:          [1, 2, 3, 4, 5, 6, 7, 8],
        recoveryId:   'recoveryId',
        keychainData: {contents: 'keychainData'}
      };

      var wallet = new Wallet(walletOptions);

      expect(wallet.id).to.equal(walletOptions.id);
      expect(wallet.key).to.equal(walletOptions.key);
      expect(wallet.recoveryId).to.equal(walletOptions.recoveryId);
      expect(wallet.keychainData).to.equal(walletOptions.keychainData);

      expect(wallet.recoveryData).to.deep.equal({});
      expect(wallet.mainData).to.deep.equal({});
    });
  });

  describe('create()', function() {
    beforeEach(function () {
      var create = Wallet.create;
      sandbox.stub(SigningKeys, 'generate').returns('signingKeys');

      // Expose the static create method on the stubbed version of Wallet.
      sandbox.stub(window, 'Wallet');
      Wallet.create = create;
    });

    it('should generate signing keys', function () {
      var wallet = Wallet.create('username', 'password', 'authToken', 'updateToken', 'recoveryId');

      expect(SigningKeys.generate.called).to.equal(true);
    });

    it('should expand the user credentials', function () {
      var wallet = Wallet.create('username', 'password', 'authToken', 'updateToken', 'recoveryId');

      expect(Wallet.expandCredentials.called).to.equal(true);
    });

    it('should create a new wallet', function () {
      var wallet = Wallet.create('username', 'password', 'authToken', 'updateToken', 'recoveryId');

      expect(Wallet.called).to.equal(true);

      var options = Wallet.args[0][0];
      expect(options.id).to.equal(1);
      expect(options.key).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(options.recoveryId).to.equal('recoveryId');
      expect(options.keychainData).to.deep.equal({
        signingKeys: 'signingKeys',
        authToken:   'authToken',
        updateToken: 'updateToken'
      });
    });
  });

  describe('decrypt()', function(){
    beforeEach(function(){
      var decrypt = Wallet.decrypt;
      var decryptData = sandbox.stub(Wallet, 'decryptData');
      var checkHash = sandbox.stub(Wallet, 'checkHash');
      sandbox.stub(SigningKeys, 'unpack').returns('signingKeys');

      // Expose the required methods on the stubbed version of Wallet.
      sandbox.stub(window, 'Wallet');
      Wallet.decrypt = decrypt;
      Wallet.decryptData = decryptData;
      Wallet.checkHash = checkHash;
    });

    it('should decrypt an existing wallet', function(){
      var encryptedWallet = {
        id:               1,
        recoveryId:       'recoveryId',
        authToken:        'authToken',
        updateToken:      'updateToken',
        mainData:         'encryptedMainData',
        mainDataHash:     'encryptedMainDataHash',
        keychainData:     'encryptedKeychainData',
        keychainDataHash: 'encryptedKeychainDataHash',
        recoveryData:     'encryptedRecoveryData',
        recoveryDataHash: 'encryptedRecoveryDataHash'
      };
      var key = [1, 2, 3, 4, 5, 6, 7, 8];
      Wallet.checkHash.withArgs('encryptedMainData', 'encryptedMainDataHash').returns(true);
      Wallet.checkHash.withArgs('encryptedKeychainData', 'encryptedKeychainDataHash').returns(true);
      Wallet.checkHash.withArgs('encryptedRecoveryData', 'encryptedRecoveryDataHash').returns(true);
      Wallet.decryptData.withArgs('encryptedMainData', key).returns('mainData');
      Wallet.decryptData.withArgs('encryptedRecoveryData', key).returns('recoveryData');
      Wallet.decryptData.withArgs('encryptedKeychainData', key).returns({
        signingKeys: 'packedSigningKeys',
        authToken:   'authToken',
        updateToken: 'updateToken'
      });

      var wallet = Wallet.decrypt(encryptedWallet, key);

      expect(Wallet.checkHash.callCount).to.equal(3);
      expect(Wallet.decryptData.callCount).to.equal(3);
      expect(Wallet.called).to.equal(true);

      var options = Wallet.args[0][0];
      expect(options.id).to.equal(1);
      expect(options.key).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(options.recoveryId).to.equal('recoveryId');
      expect(options.keychainData).to.deep.equal({
        signingKeys: 'signingKeys',
        authToken:   'authToken',
        updateToken: 'updateToken'
      });
    });

    it('should throw an error if the mainDataHash is incorrect', function(){
      var encryptedWallet = {
        id:               1,
        recoveryId:       'recoveryId',
        authToken:        'authToken',
        updateToken:      'updateToken',
        mainData:         'encryptedMainData',
        mainDataHash:     'corruptHash',
        recoveryData:     'encryptedRecoveryData',
        recoveryDataHash: 'encryptedRecoveryDataHash',
        keychainData:     'encryptedKeychainData',
        keychainDataHash: 'encryptedKeychainDataHash'
      };
      var key = [1, 2, 3, 4, 5, 6, 7, 8];
      Wallet.checkHash.withArgs('encryptedMainData', 'corruptHash').returns(false);
      Wallet.checkHash.withArgs('encryptedRecoveryData', 'encryptedRecoveryDataHash').returns(true);
      Wallet.checkHash.withArgs('encryptedKeychainData', 'encryptedKeychainDataHash').returns(true);

      var wallet;
      expect(function() {
        wallet = Wallet.decrypt(encryptedWallet, key);
      }).to.throw('Incorrect hash for mainData.');

      expect(Wallet.checkHash.callCount).to.equal(1);
      expect(Wallet.decryptData.callCount).to.equal(0);
      expect(Wallet.called).to.equal(false);
      expect(wallet).to.equal(undefined);
    });

    it('should throw an error if the keychainDataHash is incorrect', function(){
      var encryptedWallet = {
        id:               1,
        recoveryId:       'recoveryId',
        authToken:        'authToken',
        updateToken:      'updateToken',
        mainData:         'encryptedMainData',
        mainDataHash:     'encryptedMainDataHash',
        recoveryData:     'encryptedRecoveryData',
        recoveryDataHash: 'corruptHash',
        keychainData:     'encryptedKeychainData',
        keychainDataHash: 'encryptedKeychainDataHash'
      };
      var key = [1, 2, 3, 4, 5, 6, 7, 8];
      Wallet.checkHash.withArgs('encryptedMainData', 'encryptedMainDataHash').returns(false);
      Wallet.checkHash.withArgs('encryptedRecoveryData', 'corruptHash').returns(true);
      Wallet.checkHash.withArgs('encryptedKeychainData', 'encryptedKeychainDataHash').returns(true);

      var wallet;
      expect(function() {
        wallet = Wallet.decrypt(encryptedWallet, key);
      }).to.throw('Incorrect hash for mainData.');

      expect(Wallet.checkHash.callCount).to.equal(1);
      expect(Wallet.decryptData.callCount).to.equal(0);
      expect(Wallet.called).to.equal(false);
      expect(wallet).to.equal(undefined);
    });

    it('should throw an error if the recoveryDataHash is incorrect', function(){
      var encryptedWallet = {
        id:               1,
        recoveryId:       'recoveryId',
        authToken:        'authToken',
        updateToken:      'updateToken',
        mainData:         'encryptedMainData',
        mainDataHash:     'encryptedMainDataHash',
        recoveryData:     'encryptedRecoveryData',
        recoveryDataHash: 'encryptedRecoveryDataHash',
        keychainData:     'encryptedKeychainData',
        keychainDataHash: 'corruptHash'
      };
      var key = [1, 2, 3, 4, 5, 6, 7, 8];
      Wallet.checkHash.withArgs('encryptedMainData', 'encryptedMainDataHash').returns(true);
      Wallet.checkHash.withArgs('encryptedRecoveryData', 'encryptedRecoveryDataHash').returns(true);
      Wallet.checkHash.withArgs('encryptedKeychainData', 'corruptHash').returns(false);

      var wallet;
      expect(function() {
        wallet = Wallet.decrypt(encryptedWallet, key);
      }).to.throw('Incorrect hash for keychainData.');

      expect(Wallet.checkHash.callCount).to.equal(3);
      expect(Wallet.decryptData.callCount).to.equal(0);
      expect(Wallet.called).to.equal(false);
      expect(wallet).to.equal(undefined);
    });
  });

  describe('encrypt()', function(){
    var wallet;

    sandbox.stub(SigningKeys, 'getAddress').returns('address');
    var signingKeys = new SigningKeys({pub: 'pub', sec: 'sec'});
    SigningKeys.getAddress.restore();

    var walletOptions = {
      id:           1,
      key:          [1, 2, 3, 4, 5, 6, 7, 8],
      recoveryId:   'recoveryId',
      recoveryData: {contents: 'recoveryData'},
      mainData:     {contents: 'mainData'},
      keychainData: {
        keys:        signingKeys,
        authToken:   'authToken',
        updateToken: 'updateToken'
      }
    };

    beforeEach(function(){
      wallet = new Wallet(walletOptions);

      sandbox.stub(Wallet, 'encryptData');
      Wallet.encryptData.withArgs(walletOptions.recoveryData, walletOptions.key).returns('encryptedRecoveryData');
      Wallet.encryptData.withArgs(walletOptions.mainData, walletOptions.key).returns('encryptedMainData');
      var keychainData = {
        keys: {pub: 'pub', sec: 'sec'},
        authToken: 'authToken',
        updateToken: 'updateToken'
      };
      Wallet.encryptData.withArgs(keychainData, walletOptions.key).returns('encryptedKeychainData');

      sandbox.stub(SigningKeys.prototype, 'pack').returns({pub: 'pub', sec: 'sec'});
      sandbox.stub(sjcl.hash.sha1, 'hash');
      sjcl.hash.sha1.hash.withArgs('encryptedRecoveryData').returns('encryptedRecoveryDataHash');
      sjcl.hash.sha1.hash.withArgs('encryptedMainData').returns('encryptedMainDataHash');
      sjcl.hash.sha1.hash.withArgs('encryptedKeychainData').returns('encryptedKeychainDataHash');
    });

    it('should pack the signing keys', function(){
      var encryptedWallet = wallet.encrypt();

      expect(SigningKeys.prototype.pack.called).to.equal(true);
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
      expect(encryptedWallet.mainDataHash).to.equal('encryptedMainDataHash');
      expect(encryptedWallet.recoveryDataHash).to.equal('encryptedRecoveryDataHash');
      expect(encryptedWallet.keychainDataHash).to.equal('encryptedKeychainDataHash');
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

      expect(result.length).to.equal(256);
      var resultObject = JSON.parse(atob(result));
      expect(resultObject.cipherName).to.equal('aes');
      expect(resultObject.hash.length).to.equal(44);
      expect(resultObject.hashSalt.length).to.equal(24);
      expect(resultObject.cipherText.length).to.equal(64);
    });
  });

  describe('decryptData', function(){
    it('should decrypt data', function(){
      var encryptedData = "eyJoYXNoIjoiNzFHdmc5SEhmTmZFWUJFRFBJV3BrM24xQUNsUUN5aWNjYkc5NWh1Y3ZMQT0iLCJoYXNoU2FsdCI6IkVyb2xaTTZpZzBydjIzTUZhd1dkYnc9PSIsImNpcGhlclRleHQiOiIvVDdzcUtURzR5K3NhN3p1NHZzdGo0b1J1Uy9adVVpSzRXcmhVT2RJcnF6cG5HN2pmb1YrYmhrcTBGd0VLa0ZJIiwiY2lwaGVyTmFtZSI6ImFlcyJ9";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      var result = Wallet.decryptData(encryptedData, key);

      expect(result).to.deep.equal({content: 'test'});
    });

    it('should throw an error if the encryptedData was corrupted', function(){
      var corruptedData = "IjoiNzFHdmc5SEhmTmZFWUJFRFBJV3BrM24xQUNsUUN5aWNjYkc5NWh1Y3ZMQT0iLCJoYXNoU2FsdCI6IkVyb2xaTTZpZzBydjIzTUZhd1dkYnc9PSIsImNpcGhlclRleHQiOiIvVDdzcUtURzR5K3NhN3p1NHZzdGo0b1J1Uy9adVVpSzRXcmhVT2RJcnF6cG5HN2pmb1YrYmhrcTBGd0VLa0ZJIiwiY2lwaGVyTmFtZSI6";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      expect(function(){
        var result = Wallet.decryptData(corruptedData, key);
      }).to.throw('Data corrupt!');
    });

    it('should throw an error if the cipherText has been modified', function(){
      var corruptedData = "eyJoYXNoIjoiWDlXYU55aElkY090dndJR09TUkptSHJ2M296TlpOaERkdlVqSmsvcGRLRT0iLCJoYXNoU2FsdCI6IlNYZ0ZvQUR2dXdCWEJZdmxYNExxWmc9PSIsImNpcGhlclRleHQiOiJhdkd1b1dDVFMxK0tDNTJNenhBTHVJZldZczFBL1BQU0ZUVWptMXdFenpRb3VrbnhKSlgxOWt2WjlUSUw2R20iLCJjaXBoZXJOYW1lIjoiYWVzIn0=";
      var key = [0, 1, 2, 3, 4, 5, 6, 7];

      expect(function(){
        var result = Wallet.decryptData(corruptedData, key);
      }).to.throw('Message integrity check failed!');
    });
  });

  describe('checkHash()', function(){
    beforeEach(function(){
      sandbox.stub(sjcl.hash.sha1, 'hash');
    });

    it('should return true if the hash of the data matches the expected hash', function(){
      sjcl.hash.sha1.hash.returns('expectedHash');

      var result = Wallet.checkHash('data', 'expectedHash');

      expect(sjcl.hash.sha1.hash.called).to.equal(true);
      expect(result).to.equal(true);
    });

    it('should return false if the hash of the data does not match the expected hash', function(){
      sjcl.hash.sha1.hash.returns('differentHash');

      var result = Wallet.checkHash('data', 'expectedHash');

      expect(sjcl.hash.sha1.hash.called).to.equal(true);
      expect(result).to.equal(false);
    });
  });
});