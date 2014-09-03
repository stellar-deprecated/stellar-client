'use strict';

var sc = angular.module('stellarClient');

/**
 * Creates a promise chain that runs a validator before each
 * function to determine if the chain should continue or reject.
 */
sc.service('whileValid', function($q) {
  var ValidatedPromise = function(validator) {
    this.validator = validator;
    this.promiseChain = $q.when();
  };

  ValidatedPromise.prototype.then = function(next, err) {
    this.promiseChain = this.promiseChain
      .then(function(result) {
        return $q.when(this.validator())
          .then(next.bind(null, result), err);
      }.bind(this), err);

    return this;
  };

  ValidatedPromise.prototype.catch = function(err) {
    this.promiseChain = this.promiseChain.catch(err);
    return this;
  };

  ValidatedPromise.prototype.finally = function(next) {
    this.promiseChain = this.promiseChain.finally(next);
    return this;
  };

  ValidatedPromise.prototype.getPromise = function() {
    return promiseChain;
  };

  return function(validator) {
    return new ValidatedPromise(validator);
  };
});