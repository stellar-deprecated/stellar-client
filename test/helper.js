
var expect = chai.expect;

beforeEach(function() {
  this.sinon = sinon.sandbox.create();
});
afterEach(function() {
  this.sinon.restore();
});