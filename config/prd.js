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
        destination: "StellarFoundation",
        destination_address: "gpjh5ZsnpfLy1FYD8V9b7oNbwZqXMFF7Ha",
        domain: "gostellar.org",
        type: "federation_record"
    },

    INFLATION_DEST: 'g4eRqgZfzfj3132y17iaf2fp6HQj1gofjt',

    APP_ID: '1411202179109031',
    DOMAIN_NAME: 'stellar.org',
    DEFAULT_FEDERATION_DOMAIN: 'stellar.org',
    API_SERVER: 'https://api.stellar.org',
    WALLET_SERVER: 'https://wallet.stellar.org',

    PERSISTENT_SESSION : false,
    IDLE_LOGOUT_TIMEOUT : 30 * 60 * 1000, //15 minutes

    REPORT_ERRORS : true,
    SENTRY_DSN : "https://5c08986e949742d2bb29e1ffac78e50a@app.getsentry.com/26645",

    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 25,

    LOGOUT_WITH_REFRESH: true
};