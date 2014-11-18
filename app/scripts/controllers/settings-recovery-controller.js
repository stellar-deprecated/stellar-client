'use strict';

angular.module('stellarClient').controller('SettingsRecoveryCtrl', function($scope, $state, $http, $q, session, stellarApi, UserPrivateInfo, FlashMessages) {
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
    if (value === true) {
      if (!session.getUser().isEmailVerified()) {
        FlashMessages.add({
          title: 'Cannot enable recovery',
          info: 'Please verify you email first.',
          type: 'error'
        });
        return;
      } else if (!$scope.hasRecovery || session.get('wallet').mainData.needsRecoveryCodeReset) {
        FlashMessages.add({
          title: 'Cannot enable recovery',
          info: 'Please generate recovery code first by clicking "generate".',
          type: 'error'
        });
        return;
      }
    }

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
          if ($scope.migratedWalletRecovery) {
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
      .then($scope.getSettings)
      .then(function() {
        if ($scope.migratedWalletRecovery) {
          FlashMessages.dismissById('migrated-wallet-recovery-step-2');
        }

        // Remove needsRecoveryCodeReset flag
        var wallet = session.get('wallet');
        if (wallet.mainData.needsRecoveryCodeReset) {
          delete wallet.mainData.needsRecoveryCodeReset;
          return session.syncWallet('update');
        }
      })
      .then(function() {
        $scope.code = null;
        $scope.resetting = false;

        var messageInfo = 'Your recovery token has been reset! ';
        if (!$scope.toggle.recover.on) {
          // Remind a user to switch toggle to ON position
          messageInfo += 'However to be able to recover your wallet make sure you have turned on Recovery Token in your account settings.';
        }
        FlashMessages.add({
          title: 'Success',
          info: messageInfo
        });
      }).catch(function(e) {
        if (e === 'invalid_recovery_code') {
          $scope.error = 'Invalid recovery code.';
        } else if (e === 'server_error') {
          $scope.error = 'Server error.';
        } else if (e.name === 'ConnectionError') {
          $scope.error = 'Connection Error. Please try again.';
        } else {
          $scope.error = 'Unknown error. Please try again.';
          // TODO add logging
        }
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
      .success(function () {
        deferred.resolve();
      })
      .error(function(body) {
        var error;
        if (!body) {
          error = "server_error";
        } else {
          switch (body.code) {
            case 'invalid_update_token':
              // this user's update token is invalid, send to login
              $state.transitionTo('login');
              break;
            case 'invalid':
              if (body.data && body.data.field === 'recovery_code') {
                error = 'invalid_recovery_code';
              }
          }
        }
        deferred.reject(error);
      });

    return deferred.promise;
  }
});
