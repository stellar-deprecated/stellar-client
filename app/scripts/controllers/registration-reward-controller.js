'use strict';

var sc = angular.module('stellarClient');

sc.controller('RegistrationRewardCtrl', function ($scope, session, $translate) {
  $scope.reward = {
    rewardType: 0,
    title: null, // Waiting for translations to load
    subtitle: null,
    innerTitle: null,
    status: 'sent'
  };

  $translate(['rewards.create_new_wallet', 'rewards.complete_registration'])
    .then(function(translations) {
      $scope.reward.title = translations['rewards.create_new_wallet'];
      $scope.reward.subtitle = translations['rewards.complete_registration'];
      $scope.reward.innerTitle = translations['rewards.create_new_wallet'];
    });

  $scope.rewards[$scope.reward.rewardType] = $scope.reward;

  var action = $scope.reward.action;
});
