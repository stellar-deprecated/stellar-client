'use strict';

var sc = angular.module('stellarClient');

sc.service('ActionLink', function($rootScope) {
  var actionParams;

  /**
   * Parses the search portion of the URL into a parameter object.
   * If the URL contains an action parameter, the parameters are
   * stored until they are ready to be processed.
   */
  function recognize() {
    // Remove the "?"" prefix.
    var searchString = location.search.slice(1);

    // Split the search into 'key=value" pairs.
    var pairs = searchString.split('&');

    // Aggregate the key value pairs into the params object.
    var params = {};
    pairs.forEach(function(pair) {
      var parts = pair.split('=');
      params[parts[0]] = parts[1];
    });

    // Keep the parameters if they contain an action.
    if (_.has(params, 'action')) {
      actionParams = params;
    }
  }

  /**
   * Processes the action by broadcasting the stored parameters.
   * The event name is the action prefixed with 'action-'.
   */
  function process() {
    if (actionParams) {
      $rootScope.$broadcast('action-' + actionParams.action, actionParams);
      actionParams = null;
    }
  }

  return {
    recognize: recognize,
    process: process
  };
});