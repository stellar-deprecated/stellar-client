'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, session, BLOB_LOCATION, DataBlob, storeCredentials) {
  if(session.get('loggedIn')){
    // Log out if the there is an active session.
    session.removeAll();
    session.put('loggedIn', false);
  }

  $scope.username   = null;
  $scope.password   = null;
  $scope.loginError = null;

  $scope.attemptLogin = function() {
    storeCredentials($scope.username, $scope.password);

    $.ajax({
      method: 'GET',
      url: BLOB_LOCATION + '/' + session.get('blobID'),
      dataType: 'json',
      success: function(data, status, xhr){
        $scope.$apply(function() {
          if (data) {
            try {
              var blob = new DataBlob();
              blob.decrypt(data.blob, session.get('blobKey'));

              session.put('blob', blob);
              session.put('loggedIn', true);

              $state.go('dashboard');
            } catch (err) {
              // Error decrypting blob.
              $scope.loginError = err;
            }
          } else {
            // No blob found.
            $scope.loginError = 'Invalid username or password.';
          }
        });
      },
      error: function(){
        $scope.$apply(function() {
          // Request failed.
          $scope.loginError = 'Unable to contact the server.';
        });
      }
    });
  };
});