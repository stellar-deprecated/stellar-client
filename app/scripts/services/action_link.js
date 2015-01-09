'use strict';

var sc = angular.module('stellarClient');

sc.service('ActionLink', function($rootScope, $location) {
  var actionParams;

  /**
   * Use the search portion of the URL as the action parameters.
   */
  function recognize() {
    // Get an object containing the URL's parsed search parameters.
    set($location.search());
  }

  /**
   * If the parameters contain an action parameter, the parameters are
   * stored until they are ready to be processed.
   */
  function set(params) {
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
    set: set,
    process: process
  };
});