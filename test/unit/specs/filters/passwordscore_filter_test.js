'use strict';

describe('Filter: passwordScore', function () {

  // load the controller's module
  beforeEach(module('filters'));

  var filter;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($filter) {
    filter = $filter('passwordScore');
  }));

  it('If the password is not quite good enough, passwordScore should return level1', function () {
    expect(filter('abc')).to.equal('level1');
  });
  
  it('If the password is weak, passwordScore should return level2', function () {
    expect(filter('serendip')).to.equal('level2');
  });
  
  it('If the password is OK, passwordScore should return level3', function () {
    expect(filter('serend$ip')).to.equal('level3');
  });
  
  it('If the password is really good, passwordScore should return level4', function () {
    expect(filter('yAs5woN8E5oG5BA$wk')).to.equal('level4');
  });
  

});