
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
  FB.getLoginStatus(function (response) {
    var data = {
      username: username,
      updateToken: updateToken
    };

    if (response.status === 'connected') {
      data.fbID = response.authResponse.userID;
      data.fbAccessToken = response.authResponse.accessToken;
      claim(http, data, success, error);
    } else {
      FB.login(function(){
        handleFBSessionResponse(http, data, success, error);
      }, {scope: 'user_status'});
    }
  });
}

/**
 * Handle a session response when attempting to login with facebook.
 *
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.updateToken
 * @param {function} success callback
 * @param {function} error callback
 */
function handleFBSessionResponse(http, data, success, error) {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      data.fbID = response.authResponse.userID;
      data.fbAccessToken = response.authResponse.accessToken;
      claim(http, data, success, error);
    } else {
      error(response);
    }
  });
}

/**
 * Send the facebook auth data to the server to be verified and saved.
 *
 * @param {object} data
 * @param {string} data.username
 * @param {string} data.updateToken
 * @param {string} data.fbID
 * @param {string} data.fbAccessToken
 * @param {function} success callback
 * @param {function} error callback
 */
function claim(http, data, success, error) {
  http.post(Options.API_SERVER + "/claim/facebook", data)
    .success(
      function (response) {
        console.log(response.status);
        success(response.message);
      })
    .error(function (response) {
        console.log(response.status);
        error(response);
      });
}
