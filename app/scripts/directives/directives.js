/**
 * @namespace Directives
 */

//var module = angular.module('directives', ['popup']);
var module = angular.module('stellarClient');

/**
* A directive that includes the toggle template.
*/
module.directive('stToggle', function() {
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
module.directive('stSelectOnClick', function ($window) {
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
  }
});


var RP_ERRORS = 'rp-errors';
/**
 * Group of validation errors for a form field.
 *
 * @example
 *   <input name=send_destination ng-model=recipient>
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-valid>{{recipient}} is a valid destination.</div>
 *   </div>
 *
 * @memberOf Directives
 * @function rpErrors
 */
module.directive('rpErrors', [function() {
    return {
        restrict: 'EA',
        compile: function(el, attr, linker) {
            var fieldName = attr.rpErrors || attr.on,
                errs = {};

            el.data(RP_ERRORS, errs);
            return function(scope, el) {
                var formController = el.inheritedData('$formController');
                var formName = formController.$name,
                    selectedTransclude,
                    selectedElement,
                    selectedScope;

                function updateErrorTransclude() {
                    var field = formController[fieldName],
                        $error = field && field.$error;

                    if(!field)
                    {
                        console.log('field null?: '+fieldName);
                        return;
                    }
                    if (selectedElement) {
                        selectedScope.$destroy();
                        selectedElement.remove();
                        selectedElement = selectedScope = null;
                    }

                    // Pristine fields should show neither success nor failure messages
                    if (field.$pristine) return;

                    // Find any error messages defined for current errors
                    selectedTransclude = false;
                    $.each(errs, function(validator, transclude) {
                        if (validator.length <= 1) return;
                        if ($error && $error[validator.slice(1)]) {
                            selectedTransclude = transclude;
                            return false;
                        }
                    });

                    // Show message for valid fields
                    if (!selectedTransclude && errs['+'] && field.$valid) {
                        selectedTransclude = errs['+'];
                    }

                    // Generic message for invalid fields when there is no specific msg
                    if (!selectedTransclude && errs['?'] && field.$invalid) {
                        selectedTransclude = errs['?'];
                    }

                    if (selectedTransclude) {
                        scope.$eval(attr.change);
                        selectedScope = scope.$new();
                        selectedTransclude(selectedScope, function(errElement) {
                            selectedElement = errElement;
                            el.append(errElement);
                        });
                    }
                }

                scope.$watch(formName + '.' + fieldName + '.$error', updateErrorTransclude, true);
                scope.$watch(formName + '.' + fieldName + '.$pristine', updateErrorTransclude);
            };
        }
    };
}]);

/**
 * Error message for validator failure.
 *
 * Use this directive within a rp-errors block to show a message for a specific
 * validation failing.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *   </div>
 */
module.directive('rpErrorOn', [function() {
    return {
        transclude: 'element',
        priority: 500,
        compile: function(element, attrs, transclude) {
            var errs = element.inheritedData(RP_ERRORS);
            if (!errs) return;
            errs['!' + attrs.rpErrorOn] = transclude;
        }
    };
}]);

/**
 * Message for no matched validator failures.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * invalid, but there was no error message defined for any of the failing
 * validators.
 *
 * @example
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-unknown>Invalid value.</div>
 *   </div>
 */
module.directive('rpErrorUnknown', [function() {
    return {
        transclude: 'element',
        priority: 500,
        compile: function(element, attrs, transclude) {
            var errs = element.inheritedData(RP_ERRORS);
            if (!errs) return;
            errs['?'] = transclude;
        }
    };
}]);

/**
 * Tooltips
 */
// TODO: is this working?
module.directive('rpTooltip', [function() {
    return function(scope, element, attr) {
        attr.$observe('rpTooltip', function(value) {
            // Title
            var options = {'title': value};

            // Placement
            if (attr.rpTooltipPlacement)
                options.placement = attr.rpTooltipPlacement;

            $(element).tooltip('destroy');
            $(element).tooltip(options);
        });
    };
}]);

/**
 * Message for field valid.
 *
 * Use this directive within a rp-errors block to show a message if the field is
 * valid.
 */
module.directive('rpErrorValid', [function() {
    return {
        transclude: 'element',
        priority: 500,
        compile: function(element, attrs, transclude) {
            var errs = element.inheritedData(RP_ERRORS);
            if (!errs) return;
            errs['+'] = transclude;
        }
    };
}]);

module.directive('loading', function() {
    return {
        restrict: 'E',
        scope: {
            text: '@text'
        },
        templateUrl: 'templates/loading.html'
    }
});
