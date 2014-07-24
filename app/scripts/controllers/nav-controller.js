'use strict';

var sc = angular.module('stellarClient');

sc.controller('NavCtrl', function($scope, session) {
  // The session is initially not logged in.
  session.put('loggedIn',  false);

  // Allow the nav to access the session variables.
  $scope.session = session;

  $scope.$on('profilePictureLinkChanged', function () {
    $scope.pictureLink = session.get('profilePictureLink');
  });
});
