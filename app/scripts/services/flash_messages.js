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

  result.execute = function(index) {
    var action = result.messages[index].action;
    if (action) {
      action();
      result.dismiss(index);
    }
  };

  result.add = function(message) {
    $rootScope.$broadcast('flashMessage', message);
  };

  result.dismissAll = function() {
    result.messages = [];
  };

  return result;
});