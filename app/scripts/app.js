'use strict';
var STELLAR_CLIENT_REVISION = '_GIT_REVISION_GOES_HERE_';

var stellarClient = angular.module('stellarClient', [
  'angularMoment',
  'bruteRequest',
  'filters',
  'ipCookie',
  'ngGrid',
  'ngRaven',
  'ngRoute',
  'rt.debounce',
  'singletonPromise',
  'ui.router',
  'vr.passwordStrength'
]);

stellarClient.config(function($httpProvider, $stateProvider, $urlRouterProvider, RavenProvider) {

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
  ;

  $urlRouterProvider.otherwise('/dashboard');

});

stellarClient.run(function($location, $state, ipCookie){
  var atRoot    = _.isEmpty($location.path());
  var firstTime = !ipCookie("weve_been_here_before")
  var forceToRegister = atRoot && firstTime;

    if(forceToRegister) {
      $state.transitionTo('register');
      ipCookie("weve_been_here_before", "true", {expires: new Date('01 Jan 2030 00:00:00 GMT')})
    }
});

stellarClient.run(function($rootScope, $state, ipCookie, session, FlashMessages){
  $rootScope.balance = 'loading...';


  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

    switch(toState.url){

      case '/login':
        // If the user has persistent login enabled, try to login from local storage.
        if(session.isPersistent() && !session.get('loggedIn')){
          session.loginFromStorage($rootScope);

          if(session.get('loggedIn')){
            $state.transitionTo('dashboard');

            // Prevent the original destination state from loading.
            event.preventDefault();
            return;
          }
        }
        break;

      case '/logout':
        if(session.get('loggedIn')) {
          session.logout();
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

    FlashMessages.dismissAll();
  });
});