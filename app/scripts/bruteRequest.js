// bruteRequest() wrap $.ajax to automatically retry when express-brute rate limits a request.
var bruteRequest = angular.module('bruteRequest', [])
  .factory('bruteRequest', function($timeout){

    var bruteRequest = function(options){
      this.options = options;
      this.pendingRequest = null;
    };

    bruteRequest.prototype.send = function(data){
      var options = this.options;

      options.success = options.success || function () {};
      options.fail = options.fail || function () {};

      if (this.pendingRequest) this.pendingRequest.abort();

      pendingRequest = $.ajax({url: options.url, success: options.success, data: data, dataType: options.dataType, type: options.type})
        .done(function (response) {
          this.pendingRequest = null;
        })
        .fail(function (response, error, message) {
          if (message === 'Too Many Requests') {
            var suggestedRetryTime = new Date(response.responseJSON.error.nextValidRequestDate).getTime();
            var waitTime = suggestedRetryTime - Date.now();

            // Resend the request at the suggested time.
            console.log("Waiting " + waitTime + "ms");
            $timeout(function(){
              this.send(data);
            }.bind(this), waitTime);
          }

          options.fail(response, error, message);
        }.bind(this));
    };

    return bruteRequest;
  })
;
