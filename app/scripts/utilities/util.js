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
Util.showTooltip = function (element, title, type, placement) {

  var template =
    '<div class="tooltip ' + type + '" role="tooltip">' +
      '<div class="tooltip-arrow ' + placement + '"></div>' +
      '<div class="tooltip-inner"></div>' +
    '</div>';

  element.tooltip('destroy');

  element.tooltip(
    {
      trigger: "manual",
      template: template,
      placement: placement,
      title: title
    })
    .tooltip('show');
};

Util.tryGet = function(rootObject, propertyChain) {
  var propertyNames = propertyChain.split('.');

  return _.reduce(propertyNames, function (currentObject, property) {
    return _.has(currentObject, property) ? currentObject[property] : undefined;
  }, rootObject);
};
