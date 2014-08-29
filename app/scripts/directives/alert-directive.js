module.directive('alert', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      type: '@',
      dismissible: '@',
      dismissClick: '&'
    },
    templateUrl: 'templates/alert.html'
  }
});
