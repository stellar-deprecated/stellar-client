'use strict';

var stellarClient = angular.module('stellarClient', ['bruteRequest', 'ui.router', 'rt.debounce', 'vr.passwordStrength', 'ngTable', 'keygen', 'dataBlob', 'angularMoment','filters']);

stellarClient.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url:         '/login',
      templateUrl: 'states/login.html',
      authenticate: null
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
    .state('settings', {
      url:         '/settings',
      templateUrl: 'states/settings.html',
      authenticate: true
    })
  ;

  $urlRouterProvider.otherwise('/dashboard');

});


stellarClient.run(function($rootScope, $state, session){
  $rootScope.balance = 'loading...';

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

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