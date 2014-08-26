var Util = {};

Util.validateUsername = function (username) {
	if (username.length < 3 || username.length > 20) {
		return false;
	}
	return !!username.match(/^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*$/);
}

/**
* Shows a tooltip above the given element.
* - title: the text to show
* - type (error, info)
* - placement (top, left, right, bottom)
*/
Util.showTooltip = function (element, title, type, placement) {

  var placementClass = placement;

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

}

/**
 * Seed the sjcl random function with Math.random() in the case where we are
 * on a crappy browser (IE) and we've yet to get enough entropy from the
 * sjcl entropy collector.
 *
 * it sucks, but this is our last minute fix for IE support.  Our fix going
 * forward will be to use window.msCrypto on ie11, and on ie10 request
 * some mouse movement from the user (maybe?).
 *
 */
Util.ensureEntropy = function() {
  var isEnough = function() {
    return sjcl.random.isReady() !== sjcl.random._NOT_READY;
  }

  if(isEnough()){
    return;
  }

  for (var i = 0; i < 8; i++) {
    sjcl.random.addEntropy(Math.random(), 32, "Math.random()");
  }

  if(!isEnough()) {
    throw "Unable to seed sjcl entropy pool";
  }
}

Util.tryGet = function(rootObject, propertyChain) {
  var propertyNames = propertyChain.split('.');

  return _.reduce(propertyNames, function (currentObject, property) {
    return _.has(currentObject, property) ? currentObject[property] : undefined;
  }, rootObject);
};