'use strict';

var stellarClient = angular.module('stellarClient', ['ui.router']);

stellarClient.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('welcome', {
      url:         '/welcome',
      templateUrl: 'states/welcome.html'
    });

  $urlRouterProvider.otherwise('/welcome');
});