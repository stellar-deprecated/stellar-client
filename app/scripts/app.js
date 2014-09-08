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
  'vr.passwordStrength',
  'ngClipboard',
  'vcRecaptcha'
]);

stellarClient.config(function($httpProvider, $stateProvider, $urlRouterProvider, RavenProvider, ngClipProvider) {

  ngClipProvider.setPath("bower_components/zeroclipboard/dist/ZeroClipboard.swf");

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

stellarClient.run(function(ActionLink) {
  ActionLink.recognize();
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

stellarClient.run(function($rootScope, $state, $timeout, ipCookie, session, FlashMessages){
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

    if(toState.name == 'logout' && session.get('loggedIn')) {
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
        // Login with the local wallet and continue to the requested state.
        event.preventDefault();

        // HACK: The controllers in ng-included templates have not initialized yet.
        //       Apply a $timeout so they have time to listen for login events.
        $timeout(function() {
          session.login(wallet);
          $state.transitionTo(toState);
        }, 0);
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