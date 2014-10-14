module.directive('disconnectedAlert', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {},
    controller: function($rootScope, $scope) {
      $scope.isConnected = function() {
        return $rootScope.connected;
      };
    },
    templateUrl: 'templates/disconnected-alert.html'
  };
});
