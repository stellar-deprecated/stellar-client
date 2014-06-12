
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1411202179109031', // App ID
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
function fbLoginStart(username, updateToken, success, error){
  console.log("fbAuth");
  FB.getLoginStatus(function (response) {
    var data = {
      username: username,
      updateToken: updateToken
    };

    if (response.status === 'connected') {
      data.fbID = response.authResponse.userID;
      data.fbAccessToken = response.authResponse.accessToken;
      claim(data, success, error);
    } else {
      FB.login(function(){
        handleFBSessionResponse(data, success, error);
      }, {scope: 'read_stream'});
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
function handleFBSessionResponse(data, success, error) {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      data.fbID = response.authResponse.userID;
      data.fbAccessToken = response.authResponse.accessToken;
      claim(data, success, error);
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
function claim(data, success, error) {
  $.post(Options.API_SERVER + "/claim/facebook", data, null, "json")
    .done(function (response) {
      console.log(response.status);
      success();
    },
    function (response) {
      if (response.status == 'fail') {
        switch (response.code) {
          case 'validation_error':
            var error = response.data;
            if (error.field == "update_token" && error.code == "invalid") {
                // TODO: error
                break;
            }
          case 'ineligible_account':
            // TODO: inform the user their account is ineligible now
            // TODO: provide a reason in the message
          case 'fake_account':
            // TODO: inform the user their account is fake
          case 'reward_already_queued':
          case 'reward_limit_reached':
          default:
        }
      } else {

      }
    }
  );
}
