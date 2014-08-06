/**
 * To show flash messages broadcast a "flashMassage" event with an object
 * containing a title, info, optional type ("error" or "success"), an
 * optional template that is rendered inside the flash message, and an
 * optional id.
 */
sc.controller('FlashMessageCtrl', function ($scope, $rootScope, FlashMessages) {
  $scope.FlashMessages = FlashMessages;

  $scope.$watch('FlashMessages.messages', function (newVal, oldVal, scope) {
    if(newVal) { 
      scope.messages = newVal;
    }
  });

  $scope.dismissMessage = function(index) {
    FlashMessages.dismiss(index);
  };
});