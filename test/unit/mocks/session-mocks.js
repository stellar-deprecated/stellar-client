'use strict';

angular.module('mockSession', [])
  .factory('session', [function() {
    var session_data = {
      signingKeys: {
        address: "gKVuMHCLGxvCHv2i8EH2QwEA7oQM36wybY",
        secret: "s3tZPX5xE9obmKfR61vJwFVHHwVxG32DwCJb4XyMpC3Rtu4PsgG",
        secretKey: "5VDevTD8afwGJCEQHuoo7woaNKNdet13fZf3ExCkmN5CzwVZeQ9sO2TeFRIN8Lslyqt9wttPtKGKNeiBvzI69w==",
        publicKey: "Qs8FWXkPbDtk3hUSDfC7JcqrfcLbT7ShijXogb8yOvc="
      },
      wallet: {
        keychainData : {
          updateToken: true
        },
        mainData: {
          email: '',
          gateways: {
            'test-gateway': {
              domain: 'test-gateway',
              currencies: [{currency: 'usd'}, {currency: 'cny'}]
            },
            'removing-gateway': {
              domain: 'removing-gateway',
              currencies: [{currency: 'usd'}, {currency: 'cny'}]
            }
          }
        }
      }
    };
    return {get: function (key) {return session_data[key]}, syncWallet: function () {}}
  }]);
