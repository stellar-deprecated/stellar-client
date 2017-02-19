window.Util = {};

Util.validateUsername = function (username) {
	if (username.length < 3 || username.length > 20) {
		return false;
	}
	return !!username.match(/^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*$/);
};

/**
* Shows a tooltip above the given element.
* - title: the text to show
* - type (error, info)
* - placement (top, left, right, bottom)
*/
Util.showTooltip = function (element, title, type, placement, extraOptions) {

  var template =
    '<div class="tooltip ' + type + '" role="tooltip">' +
      '<div class="tooltip-arrow ' + placement + '"></div>' +
      '<div class="tooltip-inner"></div>' +
    '</div>';

  element.tooltip('destroy');

  var options = {
    trigger: "manual",
    template: template,
    placement: placement,
    title: title
  };

  // built in delay option does not support manual trigger type
  var hideTooltipFn = function () {
    element.tooltip('destroy');
  };
  var showTooltipFn = function () {
    element.tooltip(options).tooltip('show');
  };

  var showDelay = 0;
  var hideDelay = 1000;

  if (extraOptions && extraOptions.delay && extraOptions.delay.show) {
    showDelay = extraOptions.delay.show;
  }
  if (extraOptions && extraOptions.delay && extraOptions.delay.hide) {
    hideDelay = extraOptions.delay.hide;
  }

  if (showDelay) {
    hideDelay = hideDelay + showDelay;
  }

  setTimeout(showTooltipFn, showDelay);
  setTimeout(hideTooltipFn, hideDelay);
};

Util.tryGet = function(rootObject, propertyChain) {
  var propertyNames = propertyChain.split('.');

  return _.reduce(propertyNames, function (currentObject, property) {
    return _.has(currentObject, property) ? currentObject[property] : undefined;
  }, rootObject);
};

/* jslint bitwise:true */
Util.isUint32 = function (x) {
  return x >>> 0 === x;
};
