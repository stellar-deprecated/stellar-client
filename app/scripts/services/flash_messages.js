var sc = angular.module('stellarClient');

sc.factory('FlashMessages', function($rootScope) {
  var result = {};
  result.messages = [];

  $rootScope.$on('flashMessage', function(e, message) {
    result.messages.push(message);
  });

  result.dismiss = function(index) {
    result.messages.splice(index, 1);
  };

  result.add = function(message) {
    var defaults = {
      global: false, // Global messages won't be dismissed by FlashMessages.dismissAll
      showCloseIcon: true
    };
    message = _.extend(defaults, message);
    $rootScope.$broadcast('flashMessage', message);
  };

  result.dismissAll = function() {
    result.messages = result.messages.filter(function(message) {
      return message.global === true;
    });
  };

  result.dismissById = function(id) {
    result.messages = result.messages.filter(function(message) {
      return message.id !== id;
    });
  };

  return result;
});