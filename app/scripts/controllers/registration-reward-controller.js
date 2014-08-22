'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationRewardCtrl', function ($scope, session, gettextCatalog) {
  $scope.reward = {
    rewardType: 0,
    title: gettextCatalog.getString('Create a new wallet!'),
    subtitle: gettextCatalog.getString('Complete registration'),
    innerTitle: gettextCatalog.getString('Create a new wallet!'),
    status: 'sent'
  };

  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  var action = $scope.reward.action;
});
