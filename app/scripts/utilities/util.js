var Util = {};

Util.validateUsername = function (username) {
	if (username.length < 3 || username.length > 20) {
		return false;
	}
	return !!username.match(/^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*$/);
}

Util.showError = function (wrapper, title) {
    wrapper.tooltip(
      {
        trigger: "manual",
        title: title
      })
      .tooltip('show');

    setTimeout(function() {
      wrapper.tooltip('destroy');
    }, 2000);
}