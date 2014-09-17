// conf.js
exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['spec/**/*_spec.js'],
  baseUrl: 'http://localhost:8000/'
}