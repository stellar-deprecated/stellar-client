/**
 * A singletonPromise ensures that an async operation does not have multiple
 * in-flight requests pending to it.  The normal use case for a singletonPromise
 * is to prevent double form submission.  In addition, the singletonPromise
 * provides a mechanism (isLoading()) that lets you query the state of the promise,
 * allowing for external entities to change their behavior (such as showing/hiding
 * a loading indicator) based upon the promise's state.
 *
 * Examples:
 *
 *     $scope.attemptLogin = singletonPromise(function() {
 *       $scope.loginError = null;
 *       return deriveId().then(performLogin);
 *     });
 *
 * @param {Function} fun that will be serialized through the singletonPromise
 * @return {Function} a function that starts the operation, if not already running
 */
angular.module('singletonPromise', []).value('singletonPromise', function (fun) {
  var loading = false;
  var result = function() {
    if (loading) { return; }

    loading = true;

    try {
      var result = fun();
      return fun().finally(function() {
        loading = false;
      })
    } catch (err) {
      loading = false;
      throw err;
    }
  }

  /**
   * Returns whether the wrapped operation is in progress
   *
   * @return {Boolean} true if in progress
   *
   */
  result.isLoading = function() {
    return loading;
  }

  return result;
})

