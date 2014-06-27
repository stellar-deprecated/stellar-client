var Options = {
    server: {
        "trusted" : true,
        "websocket_ip" : "public-01.gostellar.org",
        "websocket_port" : 9001,
        "websocket_ssl" : true
    },

    mixpanel: {
        "token": '',
        // Don't track events by default
        "track": false
    },

    stellar_contact: {
        destination: "stellarfairy",
        destination_address: "gpjh5ZsnpfLy1FYD8V9b7oNbwZqXMFF7Ha",
        domain: "gostellar.org",
        type: "federation_record"
    },

    APP_ID: '703276886397629',
    DOMAIN_NAME: 'gostellar.org',
    DEFAULT_FEDERATION_DOMAIN: 'gostellar.org',
    API_SERVER: 'https://api.gostellar.org',
    WALLET_SERVER: 'https://wallet.gostellar.org',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : false,
    ALPHA_PHASE : true,


    REPORT_ERRORS : true,

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 50
};