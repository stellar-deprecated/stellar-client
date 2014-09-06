/**
 * Event tracker (analytics)
 *
 * @namespace rpTracker
 */

var module = angular.module('stellarClient');

module.factory('rpTracker', ['$rootScope', function ($scope) {
    var track = function (event,properties) {
        if (Options.mixpanel && Options.mixpanel.track) {
            mixpanel.track(event,properties);
        }
    };

    return {
        track: track
    };
}]);
