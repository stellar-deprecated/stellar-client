'use strict';

var sc = angular.module('stellarClient');

sc.directive('rewardPane', function(session, updateBalance, ngTableParams, $filter){
    return {
        restrict: 'E',
        replace: true,
        transclude: false,
        scope: {},
        templateUrl: '/templates/reward-pane.html',
        controller: function($scope, $element){

        }
    };
});