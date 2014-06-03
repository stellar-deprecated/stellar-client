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
  $scope.loading = false;
  $scope.errors = [];

  $scope.addEmail = function(){
    if($scope.email){
      $scope.loading = true;
      $scope.errors = [];

      var data = {
        email: $scope.email,
        username: session.get('username'),
        updateToken: session.get('blob').get('updateToken')
      };

      $.ajax({
        type: 'POST',
        url: Options.API_SERVER + '/user/email',
        dataType: 'JSON',
        data: data,
        success: function(response){
          $scope.$apply(function(){
            if(response.error) response.status = 'error';

            switch(response.status){
              case 'success':
                // Store the email address in the blob.
                session.get('blob').put('email', $scope.email);
                session.storeBlob();

                // Switch to the verify overlay.
                $rootScope.overlay = 'verifyEmail';
                $scope.clear();
                break;
              case 'error':
                $scope.errors.push('Invalid email address');
              case 'default':
                break;
            }
          });
        }
      }).done(function(){ $scope.$apply(function(){ $scope.loading = false; })})
        .error(function(){ $scope.$apply(function(){ $scope.loading = false; $scope.errors.push('An error occurred.'); })});
    }
  };

  $scope.clear = function(){
    $scope.email = '';
    $scope.loading = false;
  };

  $scope.$on('clearOverlay', $scope.clear);
});

sc.controller('VerifyEmailCtrl', function ($scope, $rootScope, session) {
  $scope.email = session.get('blob').get('email');
  $scope.loading = false;
  $scope.errors = [];

  $scope.verifyEmail = function(){
    if($scope.emailActivationCode){
      $scope.loading = true;
      $scope.errors = [];

      var data = {
        recoveryCode: $scope.emailActivationCode,
        username: session.get('username')
      };

      $.ajax({
        type: 'POST',
        url: Options.API_SERVER + '/claim/verifyEmail',
        dataType: 'JSON',
        data: data,
        success: function(response){
          $scope.$apply(function(){
            if(response.error) response.status = 'error';

            switch(response.status){
              case 'success':
                $rootScope.$broadcast('emailVerified');
                // Close the verify overlay.
                $scope.close();
                break;
              case 'error':
                $scope.errors.push('Invalid verification code.');
                break;
              case 'default':
                break;
            }
          });
        }
      }).done(function(){ $scope.$apply(function(){ $scope.loading = false; })})
        .error(function(){ $scope.$apply(function(){ $scope.loading = false; $scope.errors.push('An error occurred.'); })});
    }
  };

  $scope.clear = function(){
    $scope.emailActivationCode = '';
    $scope.loading = false;
  };

  $scope.$on('clearOverlay', $scope.clear);
});