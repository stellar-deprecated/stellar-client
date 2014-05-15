'use strict';

var stellarClient = angular.module('stellarClient', ['config', 'bruteRequest', 'ui.router', 'rt.debounce', 'vr.passwordStrength', 'ngTable', 'keygen', 'dataBlob', 'angularMoment']);

stellarClient.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url:         '/login',
      templateUrl: 'states/login.html'
    })
    .state('register', {
      url:         '/register',
      templateUrl: 'states/register.html'
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

  $urlRouterProvider.otherwise('/login');
});

stellarClient.run(function($rootScope, $state, loggedIn){
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    if(toState.authenticate && !loggedIn()){
      $state.transitionTo('login');
      event.preventDefault();
    }
  })
})