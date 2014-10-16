/**
 * @namespace Directives
 */

var sc = angular.module('stellarClient');

/**
* A directive that includes the toggle template.
*/
sc.directive('stToggle', function() {
    return {
        templateUrl: 'templates/toggle.html',
        scope: {
            ctrl: '='
        }
    };
});


/**
 * A directive which highlights the contents of the element having
 * the specified target-id or the first element of the selection.
 *
 * @example
 *    <div class="col-sm-6 receive-address" st-select-on-click target-id="currentAddress">
 *        <i class="glyphicon glyphicon-globe"></i>
 *        <span class="address" id="currentAddress">{{currentAddress()}}</span>
 *    </div>
 */
sc.directive('stSelectOnClick', function ($window) {
  return{
    restrict: 'AE',
    scope: {
      targetId: '@targetId'
    },
    link: function (scope, element) {
      element.on('click', function () {

        // get the user's selection, create a range and set the target element whose contents will be highlighted
        var selection = $window.getSelection(),
          range = document.createRange(),
          target = scope.targetId ? document.getElementById(scope.targetId) : element[0];

        // if no target element can be found, throw
        if (!target) {
          throw new Error("No target found.");
        }

        // otherwise, select the contents of the target element and add the range to the selection
        range.selectNodeContents(target);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    }
  };
});

/**
 * Tooltips
 */
// TODO: is this working?
sc.directive('rpTooltip', [function() {
    return function(scope, element, attr) {
        attr.$observe('rpTooltip', function(value) {
            // Title
            var options = {'title': value};

            // Placement
            if (attr.rpTooltipPlacement) {
                options.placement = attr.rpTooltipPlacement;
            }

            $(element).tooltip('destroy');
            $(element).tooltip(options);
        });
    };
}]);