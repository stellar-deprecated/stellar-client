'use strict';

var sc = angular.module('stellarClient');

sc.controller('ChangePasswordCtrl', function($scope, $state, $timeout, $http, session, debounce) {
  $scope.data = {
    username:             session.get('username'),
    password:             '',
    passwordConfirmation: ''
  };

  $scope.status = {
    passwordValid:        null,
    passwordConfirmValid: null
  };

  $scope.errors = {
    passwordErrors:        [],
    passwordConfirmErrors: []
  };

  $scope.validators = [];

  $scope.loading = false;

  var oldWallet = session.get('wallet');
  var newWallet;

  // Validate the input before submitting the registration form.
  // This generates messages that help the user resolve their errors.
  function validateInput() {
    var validInput = true;

    $scope.validators.forEach(function(validator){
      validInput = validator() && validInput;
    });

    return validInput;
  }

  $scope.attemptPasswordChange = function() {
    if ($scope.loading) {
      return;
    }

    $scope.loading = true;

    if (!validateInput()) {
      $scope.loading = false;
      return;
    }

    var newId = Wallet.deriveId($scope.data.username.toLowerCase(), $scope.data.password);
    var newKey = Wallet.deriveKey(newId, $scope.data.username.toLowerCase(), $scope.data.password);

    newWallet = new Wallet({
      id: newId,
      key: newKey,
      keychainData: oldWallet.keychainData,
      mainData: oldWallet.mainData
    });

    // Upload the new wallet to the server.
    session.syncWallet(newWallet, 'create')
      .then(function(){
        return replaceWallet(oldWallet, newWallet);
      })
      .finally(function(){
        session.login(newWallet);
        $state.go('dashboard');
      });
  };

  function replaceWallet(oldWallet, newWallet){
    var data = {
      oldId: oldWallet.id,
      oldAuthToken: oldWallet.keychainData.authToken,
      newId: newWallet.id,
      newAuthToken: newWallet.keychainData.authToken
    };

    return $http.post(Options.WALLET_SERVER + '/wallets/replace', data);
  }
});
