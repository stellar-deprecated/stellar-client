'use strict';

angular.module('stellarClient').controller('LoginV2Ctrl', function($scope, $state, $stateParams, $q, singletonPromise, Wallet, session) {
  setTimeout(function() {
    angular.element('#password')[0].focus();
  }, 200);

  $scope.totpRequired = $stateParams.totpRequired;

  // HACK: Perform AJAX login, but send a POST request to a hidden iframe to
  // coax Chrome into offering to remember the password.
  $scope.attemptLogin = function() {
    var params = {
      server: Options.WALLET_SERVER+'/v2',
      username: $stateParams.username.toLowerCase(),
      password: $scope.password
    };

    $scope.asyncLogin(params).catch(function(e) {
      var forbiddenError = "Login credentials are incorrect.";
      if ($stateParams.username === $stateParams.username.toLowerCase()) {
        $scope.loginError = forbiddenError;
      } else {
        // If username contains uppercase letters we need to repeat the process with
        // username passed by the user. It's because of the bug in change-password-v2-controller.
        // Username was not toLowerCase()'d there thus calculated masterKey was incorrect.
        // Fixes #1102.
        params.username = $stateParams.username;
        $scope.asyncLogin(params).catch(function(e) {
          $scope.loginError = forbiddenError;
        });
      }
    });
    return true;
  };

  $scope.asyncLogin = singletonPromise(function(params) {
    $scope.loginError = null;

    if (!$scope.password || ($scope.totpRequired && !$scope.totpCode)) {
      $scope.loginError = "Password ";
      if ($scope.totpRequired) {
        $scope.loginError += "and TOTP code ";
      }
      $scope.loginError += "cannot be blank.";
      return $q.reject();
    }

    if ($scope.totpRequired) {
      params = _.extend(params, {
        totpCode: $scope.totpCode
      });
    }

    /**
    * We're checking if a `wallet` is affected by a bug fixed in #1113.
    * If it is, we're adding a `changePasswordBug` property to `mainData`
    * to indicate whether we should display a flash message to a user.
    * @param wallet StellarWallet
    */
    function checkIfAffectedByChangePasswordBug(wallet) {
      var bugDeploy   = new Date('2014-11-17'); // Bug introduced
      var bugResolved = new Date('2015-01-12'); // Bugfix deployed
      var updatedAt   = new Date(wallet.getUpdatedAt());
      if (updatedAt >= bugDeploy && updatedAt <= bugResolved) {
        var mainData = session.get('wallet').mainData;
        if (!mainData.changePasswordBug ||
          mainData.changePasswordBug && mainData.changePasswordBug !== 'resolved') {
          mainData.changePasswordBug = 'show-info';
          return session.syncWallet('update');
        }
      }
    }

    // We don't have to run $scope.$apply because it's wrapped in singletonPromise
    return StellarWallet.getWallet(params)
      .tap(function(wallet) {
        if ($scope.rememberMe) {
          session.rememberUser();
        }
        session.login(new Wallet({
          version: 2,
          id: wallet.getWalletId(),
          key: wallet.getWalletKey(),
          keychainData: wallet.getKeychainData(),
          mainData: wallet.getMainData(),
          walletV2: wallet
        }));
      })
      .then(checkIfAffectedByChangePasswordBug)
      .then(function() {
        $state.go('dashboard');
      })
      .catch(StellarWallet.errors.TotpCodeRequired, function() {
        $scope.loginError = "2-Factor-Authentication code is required to login.";
      }).catch(StellarWallet.errors.ConnectionError, function() {
        $scope.loginError = "Error connecting wallet server. Please try again later.";
      }).catch(function(e) {
        if (e.name && e.name === 'Forbidden') {
          return $q.reject(e);
        }
        Raven.captureMessage('StellarWallet.getWallet unknown error', {
          extra: {
            error: e
          }
        });
        $scope.loginError = "Unknown error.";
      });
  });
});
