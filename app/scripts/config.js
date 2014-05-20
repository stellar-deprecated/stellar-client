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
    BLOB_LOCATION: 'http://localhost:80/blob',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : true,
    ALPHA_PHASE: true,

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 50
};