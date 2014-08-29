module.directive('alert', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      type: '@',
      dismissible: '@'
    },
    templateUrl: 'templates/alert.html'
  }
});
