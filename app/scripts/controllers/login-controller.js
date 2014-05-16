'use strict';

var sc = angular.module('stellarClient');

sc.controller('LoginCtrl', function($scope, $state, session, loggedIn, BLOB_LOCATION, DataBlob, storeCredentials, startSession, PERSISTENT_SESSION) {
  if(session.get('loggedIn')){
    // Log out if the there is an active session.
    session.removeAll();
    if(PERSISTENT_SESSION) delete localStorage.blob;
    session.put('loggedIn', false);
  } else if(loggedIn()){
    // If the user has persistent login enabled, loggedIn() will log them in
    // so they can go to the dashboard.
    $state.go('dashboard');
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
              startSession();

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
