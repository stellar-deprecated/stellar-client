'use strict';

var sc = angular.module('stellarClient');

sc.service('TutorialHelper', function() {
  var tutorials = {};

  function set(name, className) {
    tutorials[name] = className;
  }

  function get(name) {
    return tutorials[name];
  }

  function clear(name) {
    delete tutorials[name];
  }

  return {
    set: set,
    get: get,
    clear: clear
  };
});