
window.fbAsyncInit = function() {
    FB.init({
        appId      : Options.APP_ID, // App ID
        channelUrl : '//'+Options.DOMAIN_NAME+'/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
    });
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
function fbLoginStart(http, username, updateToken, success, error){
  console.log("fbAuth");
  FB.login(function (response) {
    if (response.status === 'connected') {
      success(response);
    } else {
      error(response);
    }
  }, {scope: 'user_photos'});
}
