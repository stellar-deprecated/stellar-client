var ROBOTS = /GoogleBot|Bingbot|YandexBot|Baiduspider/i;

/* exported isSupportedBrowser */
function isSupportedBrowser() {
  // whitelist robots so they can scrape the login page
  if(ROBOTS.test(navigator.userAgent))                { return true; }

  if(typeof Float64Array === "undefined")             { return false; }
  if(!Modernizr.websockets)                           { return false; }
  if(!Modernizr.dataview)                             { return false; }

  // Ensure cryptographically strong entropy
  if (!((window.crypto   && window.crypto.getRandomValues) ||
        (window.msCrypto && window.msCrypto.getRandomValues))) {
    return false;
  }

  // HACK: A specific version of Android's stock browser (AppleWebKit/534.30)
  // has a broken implementation of WebSocket. This can be removed if Modernizr
  // fixes the issue (https://github.com/Modernizr/Modernizr/issues/1399).
  if(navigator.userAgent.match('AppleWebKit/534.30')) { return false; }


  // Getting tons of sce errors from this 11 year old browser
  if(navigator.userAgent.match('Opera 7.23')) { return false; }

  return true;
}