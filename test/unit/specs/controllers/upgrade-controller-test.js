'use strict';

describe('Controller: UpgradeCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));

  //load the mocks for services
  beforeEach(module('mockSession'));


  var UpgradeCtrl, controller, scope, mockBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    scope = $rootScope.$new();
    controller = $controller;
    mockBackend = $httpBackend;
  }));

  function createController() {
    UpgradeCtrl = controller('UpgradeCtrl', {
      $scope: scope
    });
  }

  afterEach(function() {
    mockBackend.verifyNoOutstandingExpectation();
    mockBackend.verifyNoOutstandingRequest();
  });

  it('Default view should be loading', function() {
    createController();
    expect(scope.view).to.equal('loading');
  });

  describe('After checking upgrade status', function() {
    it('should show "intro" view if account is not upgraded', function() {
      mockBackend.expectGET(Options.API_SERVER + "/upgrade/balance")
        .respond(JSON.stringify({
          oldAddress: "gKVuMHCLGxvCHv2i8EH2QwEA7oQM36wybY",
          str_balance: "1000000000",
          balances: [{code: 'USD', issuer: 'gMue2N5jDZCPtPz6xFpsxrDej8EXTUGesf', balance: '120.50'}],
          claimed: false,
          upgraded: false
        }));
      createController();
      mockBackend.flush();
      expect(scope.view).to.equal('intro');
      expect(scope.balance).to.equal(1000);
    });

    it('should show "upgraded" view if account is upgraded', function() {
      mockBackend.expectGET(Options.API_SERVER + "/upgrade/balance")
        .respond(JSON.stringify({
          oldAddress: "gKVuMHCLGxvCHv2i8EH2QwEA7oQM36wybY",
          str_balance: "1000000000",
          balances: [{code: 'USD', issuer: 'gMue2N5jDZCPtPz6xFpsxrDej8EXTUGesf', balance: '120.50'}],
          claimed: true,
          upgraded: false
        }));
      createController();
      mockBackend.flush();
      expect(scope.view).to.equal('upgraded');
      expect(scope.balance).to.equal(1000);
    });
  });

  describe('After clicking Upgrade button', function() {
    beforeEach(function() {
      mockBackend.expectGET(Options.API_SERVER + "/upgrade/balance")
        .respond(JSON.stringify({
          oldAddress: "gKVuMHCLGxvCHv2i8EH2QwEA7oQM36wybY",
          str_balance: "1000000000",
          balances: [{code: 'USD', issuer: 'gMue2N5jDZCPtPz6xFpsxrDej8EXTUGesf', balance: '120.50'}],
          claimed: false,
          upgraded: false
        }));
      createController();
      mockBackend.flush();

      expect(scope.view).to.equal('intro');
      expect(scope.balance).to.equal(1000);
    });

    it('should show "upgraded" view if upgrade was successful', function() {
      var postData = {
        data: '{"newAddress":"GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB"}',
        publicKey: 'Qs8FWXkPbDtk3hUSDfC7JcqrfcLbT7ShijXogb8yOvc=',
        signature: '3uFNQAfZYZvD9PrzMvllnCzFvVGkWX4Xn7hqBx+jZkoyN1OhE5iJ4iYIN0HKD/ptUCqROpr2RbyBGIZj3g1/Ag=='
      };
      mockBackend.expectPOST(Options.API_SERVER + "/upgrade/upgrade", postData)
        .respond(JSON.stringify({status: "success"}));
      scope.upgrade();
      mockBackend.flush();
      expect(scope.view).to.equal('upgraded');
      expect(scope.balance).to.equal(1000);
      expect(scope.newNetworkSecretSeed).to.be.equal('SDSVBXV5GD6GT7AGEQQRAHXKFDXQUGRUUNOXVXLXPWL7OEYQUSMN5AH3');
      expect(scope.newNetworkAddress).to.be.equal('GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB');
      expect(scope.error).to.be.empty;
    });

    it('should go back to "intro" view if there was an error', function() {
      mockBackend.expectPOST(Options.API_SERVER + "/upgrade/upgrade")
        .respond(400, JSON.stringify({status: "fail", code: "invalid_signature"}));
      scope.upgrade();
      mockBackend.flush();
      expect(scope.view).to.equal('intro');
      expect(scope.balance).to.equal(1000);
      expect(scope.error).to.not.be.empty;
    });
  });
});
