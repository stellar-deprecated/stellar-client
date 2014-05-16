'use strict';

var sc = angular.module('stellarClient');

sc.factory('Network', function($rootScope){
  var Network = function(server, address) {
    this.remote = new ripple.Remote(server, true);
    this.address = address;
    this.connected = false;
  };

  Network.prototype.connect = function(){
    var network = this;
    this.remote.on('connected', function () {
      network.connected = true;
      $rootScope.$broadcast('connected');
    });

    this.remote.on('disconnected', function () {
      network.connected = false;
      $rootScope.$broadcast('disconnected');
    });

    this.remote.connect();
  };

  Network.prototype.updateBalance = function(){
    var request = this.remote.request_account_info(this.address);

    request.on('success', function (data) {
      $rootScope.$apply(function(){
        $rootScope.balance = data.account_data.Balance / 1000000;
      });

      console.log('Account success: "' + JSON.stringify(data) + '"');
    });

    request.on('error', function (data) {
      console.log('Account error: "' + JSON.stringify(data) + '"');
    });

    request.request();
  };

  return Network;
});