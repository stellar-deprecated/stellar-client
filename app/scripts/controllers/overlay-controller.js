'use strict';

var sc = angular.module('stellarClient');

sc.controller('OverlayCtrl', function ($scope, $rootScope) {
  $rootScope.overlay = null;

  $scope.close = function(){
    $scope.$broadcast('clearOverlay');
    $rootScope.overlay = null;
  }
});

sc.controller('AddEmailCtrl', function ($scope, $rootScope, session) {
  $scope.addEmail = function(){
    if($scope.email){
      session.get('blob').put('email', $scope.email);
      $rootScope.overlay = 'verifyEmail';
      $scope.clear();
    }
  };

  $scope.clear = function(){
    $scope.email = '';
  };

  $scope.$on('clearOverlay', $scope.clear);
});

sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, session) {
  $scope.email = session.get('blob').get('email');

  $scope.verifyEmail = function(){
    if($scope.emailActivationCode){
      // TODO: Send activation code to server and process response.
      $scope.close();
    }
  };

  $scope.clear = function(){
    $scope.emailActivationCode = '';
  };

  $scope.$on('clearOverlay', $scope.clear);
});