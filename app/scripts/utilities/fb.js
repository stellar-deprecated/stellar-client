
window.fbAsyncInit = function() {
    FB.init({
        appId      : Options.APP_ID, // App ID
        channelUrl : '//'+Options.DOMAIN_NAME+'/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });
    if (angular && angular.element(document) && angular.element(document).injector()) {
      var rootscope = angular.element(document).injector().get("$rootScope");

      setTimeout(function() {
        rootscope.$apply(function () {
          rootscope.fbinit = true;
          rootscope.$broadcast('fbinit');
        });
      }, 0);
    }
};

// Load the facebook SDK asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));


/**
 * Prompt the user to login with facebook.
 *
 * @param {string} username
 * @param {string} updateToken
 * @param {function} success callback
 * @param {function} error callback
 */
function fbLoginStart(http, success, error){
  console.log("fbAuth");
  var data = {};
  FB.login(function (response) {
    if (response.authResponse) {
      data.fbID = response.authResponse.userID;
      data.fbAccessToken = response.authResponse.accessToken;
      success(data);
    } else {
      error(response);
    }
  }, {scope: 'user_photos', auth_type: 'reauthenticate'});
}
