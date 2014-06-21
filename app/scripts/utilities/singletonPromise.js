angular.module('singletonPromise', []).value('singletonPromise', function (fun) {
  var loading = false;
  var result = function() {
    if (loading) { return; }
    loading = true;

    try {
      return fun().finally(function() {
        loading = false;
      })
    } catch (err) {
      loading = false;
      throw err;
    }
  }

  result.isLoading = function() {
    return loading;
  }

  return result;
})

