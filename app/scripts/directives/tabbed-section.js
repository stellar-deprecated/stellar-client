var sc = angular.module('stellarClient');

sc.directive('tabbedSection', function() {
  return {
    restrict: 'E',
    transclude: true,
    controller: function($scope) {
      $scope.templateUrl = '';

      $scope.$on('tabbedSection:select', function(event, tabTemplate) {
        $scope.templateUrl = tabTemplate;
        $scope.$broadcast('tabbedSection:change', tabTemplate);
      });
    },
    templateUrl: 'templates/tabbed-section.html'
  };
});


sc.directive('tab', function() {
  return {
    restrict: 'E',
    require: '^tabbedSection',
    transclude: true,
    replace: true,
    scope: {
      tabTemplate: '@',
      selected: '@'
    },
    controller: function($scope) {
      $scope.select = function() {
        if ($scope.selected) { return; }

        $scope.$emit('tabbedSection:select', $scope.tabTemplate);
        $scope.selected = true;
      };

      $scope.$on('tabbedSection:change', function(event, tabTemplate) {
        if (tabTemplate !== $scope.tabTemplate) {
          $scope.selected = false;
        }
      });

      if ($scope.selected === '' || $scope.selected === 'true') {
        $scope.selected = false;
        $scope.select();
      } else {
        $scope.selected = false;
      }
    },
    templateUrl: 'templates/tab.html'
  };
});