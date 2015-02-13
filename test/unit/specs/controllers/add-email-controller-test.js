'use strict';

describe('Controller: AddEmailCtrl', function () {

  // load the controller's module
  beforeEach(module('stellarClient'));

  var AddEmailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddEmailCtrl = $controller('AddEmailCtrl', {
      $scope: scope
    });
  }));

  it('should set scope.loading to false', function () {
    expect(scope.loading).to.equal(false);
  });

  
});