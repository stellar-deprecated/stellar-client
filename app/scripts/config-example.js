/**
 * Stellar Client Configuration
 *
 * Copy this file to config.js and edit to suit your preferences.
 */

var Options = {
    server: {
        "trusted" : true,
        "websocket_ip" : "s1.stellar.org",
        "websocket_port" : 51233,
        "websocket_ssl" : true
//    "websocket_ip" : "127.0.0.1",
//    "websocket_port" : 5006,
//    "websocket_ssl" : false
    },
    API_LOCATION: 'http://localhost:80',
    BLOB_LOCATION: 'http://localhost:80/blob,

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : false,
    ALPHA_PHASE : true,

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 50
};


/*
// Load client-side overrides
if (store.enabled) {
    $.extend(true, Options, JSON.parse(store.get('ripple_settings') || "{}"));
}


'use strict';

var config = angular.module('config', []);

config.constant('API_LOCATION', 'http://localhost:80');
config.constant('BLOB_LOCATION', 'http://localhost:80/blob');
config.constant('BLOB_DEFAULTS', {
    server: {
        trace :         true,
        trusted:        true,
        local_signing:  true,

        servers: [
            { host: '10.0.1.5', port: 6011, secure: false }
        ],

        connection_offset: 0
    }
});
*/
