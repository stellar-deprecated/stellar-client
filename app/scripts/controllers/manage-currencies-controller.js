'use strict';

var sc = angular.module('stellarClient');

sc.controller('ManageCurrenciesCtrl', function($rootScope, $scope, session) {
  var mainData             = session.get('wallet').mainData;
  mainData.gateways        = mainData.gateways || {};
  $scope.gateways          = mainData.gateways;


  $scope.closePane = function() {
    $rootScope.showTab = false;
  };
});