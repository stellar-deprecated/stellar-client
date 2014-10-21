var _sift = _sift || [];

window.loadSiftScript = function(userId) {
  _sift.push(['_setAccount', Options.SIFT_SCIENCE_ACCOUNT]);
  _sift.push(['_setUserId', userId]);
  _sift.push(['_trackPageview']);

  var e = document.createElement('script');
  e.type = 'text/javascript';
  e.async = true;
  e.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.siftscience.com/s.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(e, s);
};
