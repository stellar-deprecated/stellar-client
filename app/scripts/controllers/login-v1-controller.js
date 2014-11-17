'use strict';

angular.module('stellarClient').controller('LoginV1Ctrl', function($rootScope, $scope, $http, $state, $stateParams, $q, session, invites, Wallet, singletonPromise, usernameProof) {
  setTimeout(function() {
    angular.element('#password')[0].focus();
  }, 200);

  $scope.goBack = function($event) {
    $event.preventDefault();
    $state.go('login');
  };

  // HACK: Perform AJAX login, but send a POST request to a hidden iframe to
  // coax Chrome into offering to remember the password.
  $scope.attemptLogin = function() {
    $scope.asyncLogin();
    return true;
  };

  $scope.asyncLogin = singletonPromise(function() {
    $scope.loginError = null;
    if (!$scope.password) {
      return $q.reject("Password cannot be blank");
    }
    return Wallet.deriveId($stateParams.username, $scope.password)
      .then(performLogin)
      .then(migrateWallet)
      .then(markMigrated)
      .then(login)
      .then(updateApiRecover)
      .then(claimInvite)
      .then(function() {
        var deferred = $q.defer();

        // Store needsRecoveryCodeReset flag in the wallet but only if migrated user has recovery
        var data = {
          params: {
            username: session.get('username'),
            updateToken: session.get('wallet').keychainData.updateToken
          }
        };
        $http.get(Options.API_SERVER + "/user/settings", data)
          .success(function (response) {
            if (response.data.hasRecovery) {
              var wallet = session.get('wallet');
              wallet.mainData.needsRecoveryCodeReset = true;
              session.syncWallet('update')
                .then(function() {
                  deferred.resolve();
                });
            } else {
              deferred.resolve();
            }
          })
          .error(function (response) {
            deferred.resolve();
          });

        return deferred.promise;
      })
      .then(function() {
        $state.go('dashboard');
      });
  });

  var oldWalletId;
  function performLogin(id) {
    var deferred = $q.defer();

    oldWalletId = id;

    $http.post(Options.WALLET_SERVER + '/wallets/show', {id: id})
      .success(function(body) {
        deferred.resolve(Wallet.open(body.data, id, $stateParams.username, $scope.password));
      })
      .error(function(body, status) {
        switch(status) {
          case 404:
            $scope.loginError = 'Invalid username or password.';
            break;
          case 0:
            $scope.loginError = 'Unable to contact the server.';
            break;
          default:
            $scope.loginError = 'An error occurred.';
        }
        deferred.reject();
      });

    return deferred.promise;
  }

  function migrateWallet(wallet) {
    /* jshint camelcase:false */
    
    var deferred = $q.defer();

    // Migrate signingKeys
    var seed = new stellar.Seed().parse_json(wallet.keychainData.signingKeys.secret);
    var keyPair = seed.get_key();
    var address = keyPair.get_address();

    var publicKey = nacl.util.encodeBase64(keyPair._pubkey);
    var secretKey = nacl.util.encodeBase64(keyPair._secret);

    var signingKeys = {
      address: address.to_json(),
      secret: seed.to_json(),
      secretKey: secretKey,
      publicKey: publicKey
    };

    wallet.keychainData.signingKeys = signingKeys;

    var proof = usernameProof(wallet.keychainData.signingKeys, $stateParams.username);
    proof.migrated = true; // This is a migrated wallet

    // Perform a migration
    StellarWallet.createWallet({
      server: Options.WALLET_SERVER+'/v2',
      username: $stateParams.username.toLowerCase()+'@stellar.org',
      password: $scope.password,
      publicKey: signingKeys.publicKey,
      keychainData: JSON.stringify(wallet.keychainData),
      mainData: JSON.stringify(wallet.mainData),
      usernameProof: proof
    }).then(function(wallet) {
      var w = new Wallet({
        version: 2,
        id: wallet.getWalletId(),
        key: wallet.getWalletKey(),
        keychainData: wallet.getKeychainData(),
        mainData: wallet.getMainData(),
        walletV2: wallet
      });
      deferred.resolve(w);
    }).catch(function(e) {
      if (e.name === 'ConnectionError') {
        $scope.loginError = 'Connection error. Please try again later.';
      } else {
        $scope.loginError = 'Unknown error. Please try again later.';
      }

      deferred.reject();
      throw e;
    }).finally(function() {
      $scope.$apply();
    });

    return deferred.promise;
  }

  function markMigrated(wallet) {
    var deferred = $q.defer();

    // Mark migrated
    $http.post(Options.WALLET_SERVER + "/wallets/mark_migrated", {
      id: oldWalletId,
      authToken: wallet.keychainData.authToken
    }).success(function(response) {
      deferred.resolve(wallet);
    }).error(function(response) {
      Raven.captureMessage('Error response from /wallets/mark_migrated', {
        extra: {
          id: oldWalletId,
          response: response
        }
      });
      deferred.reject();
    });

    return deferred.promise;
  }

  function login(wallet) {
    if ($scope.rememberMe) {
      session.rememberUser();
    }
    session.login(wallet);
  }

  function updateApiRecover() {
    // Recovery code is no longer valid.
    $http.post(Options.API_SERVER + "/user/setrecover", {
      username: session.get('username'),
      updateToken: session.get('wallet').keychainData.updateToken,
      recover: false
    });
  }

  function claimInvite() {
    if(session.get('inviteCode')) {
      invites.claim(session.get('inviteCode'))
        .success(function (response) {
          $rootScope.$broadcast('invite-claimed');
        });
    }
  }
});