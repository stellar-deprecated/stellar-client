'use strict';

var stellarClient = angular.module('stellarClient', ['ui.router']);

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
      templateUrl: 'states/dashboard.html'
    })
  ;

  $urlRouterProvider.otherwise('/login');
});