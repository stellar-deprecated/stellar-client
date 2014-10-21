'use strict';
/* exported STELLAR_CLIENT_REVISION */
var STELLAR_CLIENT_REVISION = '_GIT_REVISION_GOES_HERE_';


var stellarClient = angular.module('stellarClient', [
  'angularMoment',
  'bruteRequest',
  'facebook',
  'filters',
  'ipCookie',
  'ngGrid',
  'ngRaven',
  'ngRoute',
  'rt.debounce',
  'singletonPromise',
  'ui.router',
  'vr.passwordStrength',
  'ngClipboard',
  'reCAPTCHA',
  'angulartics',
  'angulartics.segment.io',
  'stellarApi'
]);

/**
 * DEBUG TOOL!  $get makes it easy to retrieve an instance from the angular
 * dependency injection system.
 *
 * @param  {string} dependency the dependency to retrieve, by name
 * @return {object}            the resolved dependency
 */
window.$get = function (dependency) {
  return angular.element(document).injector().get(dependency);
};

stellarClient.config(function($httpProvider, $stateProvider, $urlRouterProvider, RavenProvider, ngClipProvider, reCAPTCHAProvider, FacebookProvider) {

  FacebookProvider.init(Options.APP_ID);

  ngClipProvider.setPath("bower_components/zeroclipboard/dist/ZeroClipboard.swf");

  reCAPTCHAProvider.setPublicKey(Options.CAPTCHA_KEY);
  reCAPTCHAProvider.setOptions({
    theme: 'clean'
  });

  if(Options.REPORT_ERRORS !== true) {
    RavenProvider.development(true);
  }

  sjcl.random.startCollectors();

  $httpProvider.interceptors.push('bruteRequestInterceptor');

  $stateProvider
    .state('login', {
      url:         '/login',
      templateUrl: 'states/login.html',
      authenticate: false
    })
    .state('recovery', {
      url:         '/recovery',
      templateUrl: 'states/recovery.html',
      authenticate: false
    })
    .state('username-recovery', {
      url:         '/username-recovery',
      templateUrl: 'states/username_recovery.html',
      authenticate: false
    })
    .state('register', {
      url:         '/register?inviteCode',
      templateUrl: 'states/register.html',
      authenticate: false
    })
    .state('logout', {
      url:         '/logout',
      authenticate: true
    })
    .state('dashboard', {
      url:         '/dashboard',
      templateUrl: 'states/dashboard.html',
      authenticate: true
    })
    .state('change_password', {
      url:         '/change_password',
      templateUrl: 'states/change_password.html',
      authenticate: true
    })
    .state('settings', {
      url:         '/settings',
      templateUrl: 'states/settings.html',
      authenticate: true
    })
    .state('invites', {
      url:         '/invites',
      templateUrl: 'states/invites.html',
      authenticate: true
    })
    .state('style-docs', {
      url:         '/style-docs',
      templateUrl: 'states/style-docs.html'
    })
    .state('trading', {
      url:         '/trading',
      templateUrl: 'states/trading.html',
      authenticate: true
    })
    .state('trade', {
      url:         '/trade',
      templateUrl: 'states/trade.html',
      authenticate: true
    })
  ;

  $urlRouterProvider.otherwise('/dashboard');

});

stellarClient.run(function($location, $state, ipCookie){
  var atRoot    = _.isEmpty($location.path());
  var firstTime = !ipCookie("weve_been_here_before");
  var forceToRegister = atRoot && firstTime;

    if(forceToRegister) {
      $state.transitionTo('register');
      ipCookie("weve_been_here_before", "true", {expires: new Date('01 Jan 2030 00:00:00 GMT')});
    }
});

stellarClient.run(function($rootScope, $timeout, StellarNetwork, ActionLink){
  ActionLink.recognize();

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    ActionLink.recognize();
  });

  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if(toState.authenticate) {
      StellarNetwork.ensureConnection().then(function() {
        // HACK: Timeout required to allow templates' controllers initialize and start listening.
        $timeout(ActionLink.process, 0);
      });
    }
  });
});

stellarClient.run(function($rootScope, $state, $timeout, ipCookie, session, FlashMessages){
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

    if(toState.name === 'logout' && session.get('loggedIn')) {
      event.preventDefault();
      session.logout();

      return;
    }

    // If the user is navigating to a state that requires no authentication
    // send them to the dashboard if they are logged in.
    if(!toState.authenticate && session.get('loggedIn')) {
      event.preventDefault();
      $state.transitionTo('dashboard');

      return;
    }

    // If the user is navigating to a state that requires authentication
    // try to log them in from storage. If that fails send them to the login page.
    if(!toState.authenticate || !session.get('loggedIn')) {
      var wallet;

      if(session.isPersistent() && !session.get('loggedIn')) {
        wallet = session.getWalletFromStorage();
      }

      if(wallet) {
        session.login(wallet);
      } else if(toState.authenticate) {
        // Redirect authenticated routes to login if we are unable to login from local.
        event.preventDefault();
        $state.transitionTo('login');
      }

      return;
    }

    FlashMessages.dismissAll();
  });
});

stellarClient.config(function() {
  // Configure BigNumber to never return exponential notation
  BigNumber.config({ EXPONENTIAL_AT : 1e+9 });
});


// Analytics
stellarClient.config(function ($analyticsProvider) {
  $analyticsProvider.virtualPageviews(false);
  $analyticsProvider.firstPageview(false);
});