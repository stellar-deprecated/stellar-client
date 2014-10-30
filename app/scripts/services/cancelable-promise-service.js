'use strict';

var sc = angular.module('stellarClient');

/**
 * Creates a promise chain that can be canceled.
 */
sc.service('CancelablePromise', function($q, ValidatedPromise) {
  var CancelablePromise = function(promise) {
    _.extend(this, new ValidatedPromise(this.validator));

    this.canceled = false;
  };

  CancelablePromise.prototype.validator = function() {
    if (this.canceled) {
      return $q.reject('canceled');
    } else {
      return $q.when();
    }
  };

  CancelablePromise.prototype.cancel = function() {
    this.canceled = true;
  };

  _.extend(CancelablePromise.prototype, ValidatedPromise.prototype);

  return CancelablePromise;
});