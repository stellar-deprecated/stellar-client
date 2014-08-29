'use strict';

var sc = angular.module('stellarClient');

sc.service('ActionLink', function($rootScope, $location) {
  var actionParams;

  /**
   * Parses the search portion of the URL into a parameter object.
   * If the URL contains an action parameter, the parameters are
   * stored until they are ready to be processed.
   */
  function recognize() {
    // Get an object containing the URL's parsed search parameters.
    var params = $location.search();

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