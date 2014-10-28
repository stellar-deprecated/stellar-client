'use strict';

angular.module('stellarClient').controller('LoginV1Ctrl', function($rootScope, $scope, $http, $state, $stateParams, session, invites, Wallet, singletonPromise, usernameProof) {
  setTimeout(function() {
    angular.element('#password')[0].focus();
  }, 200);

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
      .then(performLogin);
  });

  function performLogin(id) {
    return $http.post(Options.WALLET_SERVER + '/wallets/show', {id: id})
      .success(function(body) {
        Wallet.open(body.data, id, $stateParams.username, $scope.password)
          .then(function(wallet) {
            var proof = usernameProof(wallet.keychainData.signingKeys, $stateParams.username);

            // Make sure keychainData is the same after migration and after registration
            // (TOTP uses base64 secretKey)

            // Perform a migration
            StellarWallet.createWallet({
              server: Options.WALLET_SERVER+'/v2',
              username: $stateParams.username.toLowerCase()+'@stellar.org',
              password: $scope.password,
              publicKey: wallet.signingKeys.publicKey,
              keychainData: JSON.stringify(wallet.keychainData),
              mainData: JSON.stringify(wallet.mainData),
              usernameProof: proof
            }).then(function(wallet) {
              data.wallet = new Wallet({
                version: 2,
                id: wallet.getWalletId(),
                key: wallet.getWalletKey(),
                keychainData: wallet.getKeychainData(),
                mainData: wallet.getMainData(),
                walletV2: wallet
              });
              deferred.resolve(data);
            });
            if ($scope.rememberMe) {
              session.rememberUser();
            }
            session.login(wallet);

            if(session.get('inviteCode')) {
              invites.claim(session.get('inviteCode'))
                .success(function (response) {
                  $rootScope.$broadcast('invite-claimed');
                });
            }

            $state.go('dashboard');
          });
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
      });
  }
});