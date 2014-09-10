'use strict';

var sc = angular.module('stellarClient');

sc.controller('ManageCurrenciesCtrl', function($rootScope, $scope, session) {
  var mainData             = session.get('wallet').mainData;
  mainData.gateways        = mainData.gateways || {};
  $scope.gateways          = mainData.gateways;


  $scope.closePane = function() {
    $rootScope.showTab = false;
  };

  $scope.showAddAlert = function(domain) {
    $scope.addedGatewayDomain = domain;
  };

  $scope.hideAddAlert = function() {
    $scope.addedGatewayDomain = null;
  };

  $scope.showRemoveAlert = function(domain) {
    $scope.removedGatewayDomain = domain;
  };

  $scope.hideRemoveAlert = function() {
    $scope.removedGatewayDomain = null;
  };
});