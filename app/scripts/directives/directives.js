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

/*
 * Defines the rp-if tag. This removes/adds an element from the dom depending on a condition
 * Originally created by @tigbro, for the @jquery-mobile-angular-adapter
 * https://github.com/tigbro/jquery-mobile-angular-adapter
 */
module.directive('rpIf', [function() {
    return {
        transclude: 'element',
        priority: 1000,
        terminal: true,
        restrict: 'A',
        compile: function(element, attr, linker) {
            return function(scope, iterStartElement, attr) {
                iterStartElement[0].doNotMove = true;
                var expression = attr.rpIf;
                var lastElement;
                var lastScope;
                scope.$watch(expression, function(newValue) {
                    if (lastElement) {
                        lastElement.remove();
                        lastElement = null;
                    }
                    if (lastScope) {
                        lastScope.$destroy();
                        lastScope = null;
                    }
                    if (newValue) {
                        lastScope = scope.$new();
                        linker(lastScope, function(clone) {
                            lastElement = clone;
                            iterStartElement.after(clone);
                        });
                    }
                    // Note: need to be parent() as jquery cannot trigger events on comments
                    // (angular creates a comment node when using transclusion, as ng-repeat does).
                    iterStartElement.parent().trigger("$childrenChanged");
                });
            };
        }
    };
}]);

/**
 * Group of validation errors for a form field.
 *
 * @example
 *   <input name=send_destination ng-model=recipient>
 *   <div rp-errors=send_destination>
 *     <div rp-error-on=required>This field is required.</div>
 *     <div rp-error-valid>{{recipient}} is a valid destination.</div>
 *   </div>
 */
var RP_ERRORS = 'rp-errors';
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

/**
 * Creates a child scope and immediately calls $destroy on it what implies that
 * calls to $digest() will no longer propagate to the scope and its children.
 *
 * Please note that in case data is `undefined` it will bind `undefined` and
 * won't watch for changes.
 */
module.directive('bindOnce', function() {
  return {
    scope: true,
    link: function($scope) {
      setTimeout(function() {
        $scope.$destroy();
      }, 0);
    }
  }
});