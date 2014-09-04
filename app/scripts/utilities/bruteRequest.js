// bruteRequest() wrap $.ajax to automatically retry when express-brute rate limits a request.
var bruteRequest = angular.module('bruteRequest', []);

bruteRequest.factory('bruteRequestInterceptor', function ($q, $timeout, $injector) {

  var bruteRecoverer = {
    responseError: function (response) {
      if (response.status === '429') {
        var error = response.data.error;
        // inject http to avoid angular circular dependency error
        var http = $injector.get('$http');

        var suggestedRetryTime = new Date(error.nextValidRequestDate).getTime();
        var waitTime = suggestedRetryTime - Date.now();

        // Resend the request at the suggested time.
        console.log("Waiting " + waitTime + "ms");

        return $timeout(function() {
          return http(response.config);
        }, waitTime);
      }
      return $q.reject(response);
    }
  };

  return bruteRecoverer;
});