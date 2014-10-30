var sc = angular.module('stellarClient');

sc.directive('alert', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      type: '@',
      dismissible: '@',
      dismissClick: '&'
    },
    compile: function(element, attrs) {
      if (typeof attrs.dismissClick !== 'undefined') {
        attrs.dismissible = 'true';
      } else {
        // Create a default dismiss handler
        attrs.dismissClick = function() {
          element.remove();
        };
      }
    },
    templateUrl: 'templates/alert.html'
  };
});
