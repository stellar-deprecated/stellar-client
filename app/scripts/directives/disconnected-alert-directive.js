var sc = angular.module('stellarClient');

sc.directive('disconnectedAlert', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: {},
    controller: function($scope, $timeout, StellarNetwork) {
      $scope.status = '';
      $scope.reconnectTime = 0;
      $scope.reconnectTimer = null;

      if(StellarNetwork.connected) {
        $scope.status = 'connected';
      }

      $scope.$on('stellar-network:disconnected', function() {
        $scope.status = 'disconnected';
      });

      $scope.$on('stellar-network:connected', function() {
        $scope.status = 'connected';
      });

      $scope.$on('stellar-network:connecting', function() {
        $scope.status = 'connecting';
      });

      $scope.$on('stellar-network:reconnecting', function(e, timeout) {
        $scope.status = 'reconnecting';
        $scope.reconnectTime = Date.now() + timeout;

        if($scope.reconnectTimer) {
          $timeout.cancel($scope.reconnectTimer);
        }

        $scope.reconnectTimer = $timeout(function() {
          $scope.reconnectTimer = null;

          if($scope.status === 'reconnecting') {
            $scope.status = 'connecting';
          }
        }, timeout);
      });

      $scope.timeUntilReconnect = function() {
        return Math.max($scope.reconnectTime - Date.now(), 0);
      };

      $scope.reconnect = function() {
        StellarNetwork.forceReconnect();
      };
    },
    templateUrl: 'templates/disconnected-alert.html'
  };
});
