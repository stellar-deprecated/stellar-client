'use strict';

angular.module('stellarClient').controller('SettingsRecoveryCtrl', function($scope, $state, $http, $q, session, stellarApi, UserPrivateInfo, FlashMessages, ipCookie) {
  var wallet = session.get('wallet');
  var params = {
    username: session.get('username'),
    updateToken: wallet.keychainData.updateToken
  };

  var serverRecoveryCode = null;

  $scope.reset = function () {
    $scope.error = null;
    $scope.resetting = false;
    $scope.sendingRecoveryCode = false;
    $scope.code = null;

    // We check whether user is in process of changing recovery code. If so,
    // we show a form to finish the process.
    stellarApi.User.getNewRecoveryCode(params)
      .then(function(response) {
        if (response.data.status === 'success') {
          $scope.resetting = true;
          serverRecoveryCode = response.data.serverRecoveryCode;
        } else {
          $scope.resetting = false;
        }
      });
  };
  $scope.reset();
  $scope.$on('settings-refresh', $scope.reset);

  $scope.$on('settings-recovery-clicked', function($event, toggle) {
    toggleRecovery(!toggle.on);
  });

  function toggleRecovery(value) {
    $http.post(Options.API_SERVER+'/user/setrecover', _.extend(params, {
      recover: value
    })).success(function () {
      $scope.$emit('settings-recovery-toggled', value);
    }).error(function () {
      FlashMessages.add({
        title: 'Server error',
        info: 'There was an error contacting server. Please try again later.',
        type: 'error'
      });
    });
  }

  $scope.resetRecovery = function($event) {
    $event.preventDefault();
    $scope.sendingRecoveryCode = true;

    stellarApi.User.changeRecoveryToken(params)
     .success(function(response) {
        if (response.status === 'success') {
          if ($scope.$parent.migratedWalletRecovery) {
            FlashMessages.dismissById('migrated-wallet-recovery-step-1');
            FlashMessages.add({
              id: 'migrated-wallet-recovery-step-2',
              info: 'Step 2: We\'ve just sent a new code to your email. Enter your code below.',
              showCloseIcon: false
            });
          }

          $scope.resetting = true;
          serverRecoveryCode = response.serverRecoveryCode;
        }
     }).error(function (response){
        $scope.resetting = false;
        if (response.code === 'no_email') {
          FlashMessages.add({
            title: 'No email added',
            info: 'Add and verify your email first. Recovery token will be sent to your email inbox.'
          });
        } else {
          FlashMessages.add({
            title: 'Recovery Error',
            info: 'There was error trying to generate recovery token. Please try again later.',
            type: 'error'
          });
        }
     }).finally(function() {
        $scope.sendingRecoveryCode = false;
     });
  };

  $scope.confirmResetRecovery = function($event) {
    $event.preventDefault();
    $scope.error = null;

    getServerRecoveryCode($scope.code)
    .then(function() {
      var userPartBytes = bs58.decode($scope.code);
      var serverPartBytes = bs58.decode(serverRecoveryCode);
      var fullRecoveryCodeBytes = userPartBytes.concat(serverPartBytes);
      var fullRecoveryCode = bs58.encode(fullRecoveryCodeBytes);
      return wallet.walletV2.enableRecovery({
        recoveryCode: fullRecoveryCode,
        secretKey: wallet.keychainData.signingKeys.secretKey
      });
    })
    .then(function() {
      return stellarApi.User.finishChangeRecoveryToken(_.extend(params, {
        userRecoveryCode: $scope.code
      }));
    })
    // We need to reload settings because `recover` setting is set to `false` if there is no recovery code.
    .then($scope.$parent.getSettings)
    .then(function() {
      $scope.code = null;
      $scope.resetting = false;

      if ($scope.$parent.migratedWalletRecovery) {
        FlashMessages.dismissById('migrated-wallet-recovery-step-2');
        ipCookie.remove('needs_recovery_code_reset');
      }

      var messageInfo = 'Your recovery token has been reset! ';
      if (!$scope.$parent.toggle.recover.on) {
        // Remind a user to switch toggle to ON position
        messageInfo += 'However to be able to recover your wallet make sure you have turned on Recovery Token in your account settings.';
      }
      FlashMessages.add({
        title: 'Success',
        info: messageInfo
      });

      if (session.isPersistent()) {
        session.get('wallet').saveLocal(); // We need to rewrite wallet object because lockVersion has changed
      }
    }).catch(StellarWallet.errors.ConnectionError, function(e) {
      $scope.error = 'Connection error. Please try again.';
    }).catch(function(e) {
      if (!$scope.error) {
        $scope.error = 'Unknown error. Please try again.';
      }
      // TODO add logging
    }).finally(function() {
      $scope.$apply();
    });
  };

  $scope.cancelResetRecovery = function($event) {
    $event.preventDefault();

    stellarApi.User.cancelChangingRecoveryCode(params)
      .success(function() {
        $scope.resetting = false;
      }).error(function() {
        $scope.error = 'Cannot cancel changing recovery code now. Please try again.';
      });
  };

  function getServerRecoveryCode(userRecoveryCode) {
    var deferred = $q.defer();

    var data = {
      userRecoveryCode: userRecoveryCode,
      username:         session.get('username'),
      updateToken:      wallet.keychainData.updateToken
    };

    stellarApi.User.getServerRecoveryCode(data)
      .success(function (response) {
        return deferred.resolve();
      })
      .error(function(response) {
        if (!response){
          $scope.error = "Server error";
          return deferred.reject();
        }

        if (response.status !== 'fail'){
          $scope.error = 'Unexpected status: ' + response.status;
          return deferred.reject();
        }

        switch (response.code) {
          case 'invalid_update_token':
            // this user's update token is invalid, send to login
            $state.transitionTo('login');
            break;
          case 'invalid':
            if (response.data && response.data.field === 'recovery_code') {
              //$scope.error = 'Invalid recovery code.';
              $scope.error = 'Invalid recovery code.';
            }
        }

        return deferred.reject();
      });

    return deferred.promise;
  }
});