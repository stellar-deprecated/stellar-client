'use strict';
var STELLAR_CLIENT_REVISION = '_GIT_REVISION_GOES_HERE_';

var stellarClient = angular.module('stellarClient', ['ui.router', 'rt.debounce', 'vr.passwordStrength', 'ngTable', 'ngRoute', 'angularMoment', 'filters', 'bruteRequest',  'singletonPromise', 'ngRaven']);

stellarClient.config(function($httpProvider, $stateProvider, $urlRouterProvider, RavenProvider) {

  if(Options.REPORT_ERRORS !== true) {
    RavenProvider.development(true);
  }

  $httpProvider.interceptors.push('bruteRequestInterceptor');

  $stateProvider
    .state('login', {
      url:         '/login',
      templateUrl: 'states/login.html',
      authenticate: null
    })
    .state('recovery', {
      url:         '/recovery',
      templateUrl: 'states/recovery.html',
      authenticate: false
    })
    .state('alpha', {
      url:         '/alpha',
      templateUrl: 'states/alpha.html',
      authenticate: false
    })
    .state('register', {
      url:         '/register',
      templateUrl: 'states/register.html',
      authenticate: false
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
    .state('browser_unsupported', {
      url:         '/browser_unsupported',
      templateUrl: 'states/browser_unsupported.html',
      authenticate: null
    })
  ;

  $urlRouterProvider.otherwise('/dashboard');

});

stellarClient.run(function($rootScope, $state, session){
  $rootScope.balance = 'loading...';
  $rootScope.unsupportedBrowser = !Modernizr.websockets;

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

    if($rootScope.unsupportedBrowser && toState.name !== "browser_unsupported") {
      $state.transitionTo('browser_unsupported');
      event.preventDefault();
    }

    switch(toState.url){

      case '/login':
        // If the user has persistent login enabled, try to login from local storage.
        if(Options.PERSISTENT_SESSION && !session.get('loggedIn')){
          session.loginFromStorage($rootScope);

          if(session.get('loggedIn')){
            $state.transitionTo('dashboard');

            // Prevent the original destination state from loading.
            event.preventDefault();
            return;
          }
        }
        break;

      case '/register':
        // If the user is trying to register, ensure they are an alpha tester.
        if(Options.ALPHA_PHASE && !session.get('alpha')){
          $state.transitionTo('alpha');

          // Prevent the original destination state from loading.
          event.preventDefault();
          return;
        }
        break;
    }

    // If the user is navigating to a state that requires authentication
    // send them to the login page if they are not logged in.
    if(toState.authenticate === true && !session.get('loggedIn')){
      $state.transitionTo('login');

      // Prevent the original destination state from loading.
      event.preventDefault();
    }

    // If the user is navigating to a state that requires no authentication
    // send them to the dashboard if they are logged in.
    if(toState.authenticate === false && session.get('loggedIn')){
      $state.transitionTo('dashboard');

      // Prevent the original destination state from loading.
      event.preventDefault();
    }
  });
});