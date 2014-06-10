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
                $rootScope.emailToVerify = $scope.email;
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

  $scope.cancel = function(){
    $scope.clear();
    $scope.closeReward();
  };
});
