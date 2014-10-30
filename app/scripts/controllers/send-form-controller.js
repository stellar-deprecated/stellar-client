'use strict';
/* jshint camelcase:false */

var sc = angular.module('stellarClient');

sc.controller('SendFormController', function($rootScope, $scope, Payment, debounce) {

  // This object holds the raw send form data entered by the user.
  $scope.sendFormModel = {};

  // Populate the send form with parameters from the send action.
  $scope.$on('action-send', function(event, params){
    $scope.openSend();

    $scope.sendFormModel.recipient = params.dest + '?dt=' + params.dt;
    $scope.sendFormModel.amount = Number(params.amount);
    $scope.sendFormModel.currency = params.currency || 'STR';
  });

  // Reset the send form.
  $scope.$on('reset', function () {
    $scope.sendFormModel = {};
    $scope.sendFormModel.currency = $scope.send.currencyChoices[0];
  });

  /**
   * Listen to payment events.
   */

  $scope.$on('payment:checking-destination', function(event) {
    resetPaths();
    $scope.send.pathStatus = 'checking-destination';
  });

  $scope.$on('payment:paths-loading', function(event) {
    resetPaths();
    $scope.send.pathStatus = 'paths-loading';
  });

  $scope.$on('payment:error', function(event) {
    resetPaths();
    $scope.send.pathStatus = 'error';
  });

  $scope.$on('payment:paths', function(event, paths) {
    resetPaths();
    $scope.send.paths = paths;
    $scope.send.pathStatus = paths.length ? 'paths-loaded' : 'paths-empty';
  });

  $scope.$on('payment:insufficient-str', function(event, minimumAmount) {
    resetPaths();
    $scope.send.fundStatus = 'insufficient-str';
    $scope.send.str_deficiency = minimumAmount;
  });

  $scope.$on('payment:paths-reset', function(event) {
    resetPaths();
  });

  // Clear the paths and path status.
  function resetPaths() {
    $scope.send.paths = [];
    $scope.send.pathStatus = '';
    $scope.send.fundStatus = '';
    $scope.send.str_deficiency = null;
  }

  $scope.$watch('sendFormModel.recipient', updateRecipient);
  $scope.$watch('sendFormModel.destinationTag', updateDestination);

  $scope.$watch('sendFormModel.amount', updateAmount);
  $scope.$watch('sendFormModel.currency', updateAmount);

  /**
   * Update the payment destination.
   */

  function updateRecipient(newValue) {
    if(newValue === $scope.send.destination.address || newValue === $scope.send.destination.federatedName) {
      return;
    }

    $scope.sendFormModel.destinationTag = null;
    $scope.resetDestinationDependencies();
    updateDestination();
  }

  function updateDestination() {
    clearPoptip();

    Payment.setDestination($scope.sendFormModel.recipient, $scope.sendFormModel.destinationTag)
      .then(handleDestination)
      .catch(handleDestinationError);
  }

  function handleDestination(destination) {
    clearPoptip();

    $scope.send.destination = destination;
    $scope.send.currencyChoices = destination.currencyChoices;

    if(destination.inputType === 'federatedName') {
      showAddressFound(destination.address);
      $scope.sendFormModel.recipient = destination.federatedName;
    } else {
      $scope.sendFormModel.recipient = destination.address;
      Payment.getFederatedName()
        .then(function(federatedName) {
          showUserFound(federatedName);
        });
    }
  }

  function handleDestinationError(error) {
    switch(error) {
      case 'canceled':
        return;

      case 'empty':
        $scope.resetDestinationDependencies();
        return;

      default:
        $scope.resetDestinationDependencies();
        showError(error);
    }
  }

  $scope.showDestinationTag = function() {
    return $scope.send.destination.requireDestinationTag && !$scope.send.destination.fixedDestinationTag;
  };

  var showError = debounce(function(error) {
    $('#recipient').tooltip('destroy');

    if(error === 'federation-error') {
      Util.showTooltip($('#recipient'), "Account not found", "error", "top");
    }
  }, 500);

  function clearPoptip() {
    showError.cancel();
    $('#recipient').tooltip('destroy');
  }

  function showAddressFound(address) {
    var displayAddress = address;
    if($scope.send.destination.destinationTag) {
      displayAddress += '?dt=' + $scope.send.destination.destinationTag;
    }

    Util.showTooltip($('#recipient'), "wallet address found: " + displayAddress, "info", "top");
  }

  function showUserFound(username) {
    var displayName = username;
    if($scope.send.destination.destinationTag) {
      displayName += '?dt=' + $scope.send.destination.destinationTag;
    }

    Util.showTooltip($('#recipient'), "user found: " + displayName, "info", "top");
  }

  /**
   * Update the payment amount.
   */

  function updateAmount() {
    Payment.setAmount($scope.sendFormModel.amount, $scope.sendFormModel.currency)
      .then(function(amount) {
        $scope.send.amount = amount;
      });
  }

  $scope.changeCurrency = function(newCurrency) {
    $scope.sendFormModel.currency = newCurrency;
  };

  //this is because the currency dropdown gets cut-off because the parent container
  //is set to overflow:hidden for the slide animation effect. so we have to
  //set overflow:visible if they click onto the dropdown menu.
  $scope.setOverflowVisible = function(){
    $rootScope.overflowVisible = true;
  };
});
