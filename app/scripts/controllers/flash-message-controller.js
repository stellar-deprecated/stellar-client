/**
 * To show flash messages broadcast a "flashMassage" event with an object
 * containing a title, info, and optional type ("error" or "success").
 */
sc.controller('FlashMessageCtrl', function ($scope, $rootScope) {
  $scope.messages = [];

  $rootScope.$on('flashMessage', function(e, message) {
    $scope.messages.push(message);
  });

  $scope.dismissMessage = function(index) {
    $scope.messages.splice(index, 1);
  };
});