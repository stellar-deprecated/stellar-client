/**
 * To show flash messages broadcast a "flashMassage" event with an object
 * containing a title, info, optional type ("error" or "success"),
 * and optional unique id that prevents duplicate messages.
 */
sc.controller('FlashMessageCtrl', function ($scope, $rootScope) {
  $scope.messages = [];

  $rootScope.$on('flashMessage', function(e, newMessage) {
    // Filter out old messages with the same id.
    if (newMessage.id) {
      $scope.messages = $scope.messages.filter(function(message) {
        return message.id != newMessage.id;
      });
    }

    $scope.messages.unshift(newMessage);
  });

  $scope.dismissMessage = function(index) {
    $scope.messages.splice(index, 1);
  };
});