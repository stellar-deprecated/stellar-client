'use strict';

var sc = angular.module('stellarClient');

sc.controller('NavCtrl', function($scope, session) {
  // The session is initially not logged in.
  $scope.loggedIn = false;
  $scope.username = '';

  var wallet = null;
  var user = null;

  function init() {
    $scope.loggedIn = true;
    $scope.username = session.get('username');
    wallet = session.get('wallet');
  }

  if(session.get('loggedIn')) {
    init();
  } else {
    $scope.$on('walletAddressLoaded', init);
  }

  user = session.getUser();

  if(!user) {
    $scope.$on('userLoaded', function() {
      user = session.getUser();
    });
  }

  $scope.getLogoLink = function () {
    return $scope.loggedIn ? '#/' : 'http://www.stellar.org';
  };

  $scope.showTradingLink = function() {
    return wallet && wallet.get('mainData', 'showTrading', false);
  };

  $scope.showInvitesLink = function() {
    return $scope.getInvitesLeft() || $scope.getSentInvites();
  };

  $scope.getSentInvites = function () {
    return user && user.getSentInvites().length;
  };

  $scope.getInvitesLeft = function () {
    return user && user.getUnsentInvites().length;
  };

  $scope.getInvitesClass = function () {
    if($scope.getInvitesLeft()) {
      return 'nav-has-invites';
    }
  };
});
