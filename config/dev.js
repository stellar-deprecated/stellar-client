var Options = {
    server: {
        "trusted" : true,
        "websocket_ip" : "localhost",
        "websocket_port" : 9001,
        "websocket_ssl" : false
    },

    mixpanel: {
        "token": '',
        // Don't track events by default
        "track": false
    },


    stellar_contact: {
        destination: "StellarFoundation",
        destination_address: "gpjh5ZsnpfLy1FYD8V9b7oNbwZqXMFF7Ha",
        domain: "gostellar.org",
        type: "federation_record"
    },

    INFLATION_DEST: 'gJB1W4wbxvMVawvXeo4hz3bwaf2qnWHL2x',

    APP_ID: '1512347158994532',
    DOMAIN_NAME: 'stellar.local.dev',
    DEFAULT_FEDERATION_DOMAIN: 'gostellar.org',
    API_SERVER: 'http://localhost:3001',
    WALLET_SERVER: 'http://localhost:3000',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : true,
    ALPHA_PHASE : true,
    IDLE_LOGOUT_TIMEOUT : 60 * 60 * 1000, //an hour


    REPORT_ERRORS : false,

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 50
};