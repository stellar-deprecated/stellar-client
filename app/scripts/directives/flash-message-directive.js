var sc = angular.module('stellarClient');

sc.directive('flashMessages', function() {
  return {
    restrict: 'E',
    templateUrl: 'templates/flash-message-container.html',
    controller: 'FlashMessageCtrl'
  };
});
