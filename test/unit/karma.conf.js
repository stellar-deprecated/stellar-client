// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-10-07 using
// generator-karma 0.8.3

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['mocha', 'sinon-chai'],

    // list of files / patterns to load in the browser
    files: [
    
    //global mocks
    'test/unit/mocks/globals-mocks.js',

    "app/bower_components/jquery/dist/jquery.js",
    "app/bower_components/angular/angular.js",
    "app/bower_components/angular-cookie/angular-cookie.js",
    "app/bower_components/angular-facebook/lib/angular-facebook.js",
    "app/bower_components/angular-route/angular-route.js",
    "app/bower_components/angular-ui-router/release/angular-ui-router.js",
    "app/bower_components/ng-debounce/angular-debounce.js",
    "app/bower_components/angular-password-strength/build/angular-password-strength.min.js",
    "app/bower_components/autofill-event/src/autofill-event.js",
    "app/bower_components/crypto-js/components/core.js",
    "app/bower_components/crypto-js/components/ripemd160.js",
    "app/bower_components/moment/moment.js",
    "app/bower_components/angular-moment/angular-moment.js",
    "app/bower_components/lodash/dist/lodash.js",
    "app/bower_components/angular-raven/angular-raven.js",
    "app/bower_components/qrcode/lib/qrcode.min.js",
    "app/bower_components/angular-qr/angular-qr.min.js",
    "app/bower_components/ng-grid/build/ng-grid.js",
    "app/bower_components/ng-grid/plugins/ng-grid-flexible-height.js",
    "app/bower_components/zeroclipboard/dist/ZeroClipboard.js",
    "app/bower_components/ng-clip/src/ngClip.js",
    "app/bower_components/bignumber.js/bignumber.js",
    "app/bower_components/angular-recaptcha/release/angular-recaptcha.js",
    "app/bower_components/stellar-wallet-js-sdk/build/stellar-wallet.min.js",
    "app/bower_components/tweetnacl/nacl-fast.min.js",
    "app/bower_components/angulartics/src/angulartics.js",
    "app/bower_components/angulartics/src/angulartics-segmentio.js",
    "app/bower_components/URIjs/src/URI.js",
    'app/bower_components/angular-mocks/angular-mocks.js',
    'app/bower_components/stellar-lib/build/stellar-lib.js',
    'app/bower_components/zxcvbn/zxcvbn.js',
    
    
    //app
    'app/scripts/modules/stellar-api/stellar-api.js',
    'app/scripts/**/*.js',
    
    //test-only mocks
    'test/unit/mocks/gateway-mocks.js',
    'test/unit/mocks/session-mocks.js',
    'test/unit/mocks/stellar-network-mocks.js',
   
    //specs
    'test/unit/specs/controllers/add-email-controller-test.js',
    'test/unit/specs/controllers/manage-currencies-test.js',
    
    //gateways
    'test/unit/specs/controllers/add-gateway-controller-test.js',
    'test/unit/specs/controllers/gateway-list-controller-test.js',
    'test/unit/specs/controllers/gateway-list-item-controller-test.js',
      
    //password
    'test/unit/specs/controllers/password-controller-test.js'
      
    ],
    

    // list of files / patterns to exclude
    exclude: [
    'app/bower_components/URIjs/**/**.js',//couldn't get this URI to work server side
    'app/scripts/libraries/underscore.js'//Why do we have underscore in there? 
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-mocha',
      'karma-sinon-chai',
      'karma-spec-reporter'
    ],
    
    reporters: ['spec'],
    

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
    
  });
};
