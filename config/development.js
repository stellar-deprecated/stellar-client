var Options = {
    server: {
        "trusted" : true,
        "websocket_ip" : "public-01.gostellar.org",
        "websocket_port" : 9001,
        "websocket_ssl" : false
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

    APP_ID: '706937569364894',
    DOMAIN_NAME: 'stellar.local.dev',
    DEFAULT_FEDERATION_DOMAIN: 'gostellar.org',
    API_SERVER: 'http://localhost:3001',
    WALLET_SERVER: 'http://localhost:3000',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : true,
    ALPHA_PHASE : true,

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 50
};