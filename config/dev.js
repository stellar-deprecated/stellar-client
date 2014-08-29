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

    INFLATION_DEST: 'gJB1W4wbxvMVawvXeo4hz3bwaf2qnWHL2x',

    APP_ID: '1512347158994532',
    DOMAIN_NAME: 'stellar.local.dev',
    DEFAULT_FEDERATION_DOMAIN: 'stellar.org',
    API_SERVER: 'http://localhost:3001',
    WALLET_SERVER: 'http://localhost:3000',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : true,
    IDLE_LOGOUT_TIMEOUT : 60 * 60 * 1000, //an hour
    COOKIE_SECURE: false,


    REPORT_ERRORS : false,
    SENTRY_DSN : "https://5c08986e949742d2bb29e1ffac78e50a@app.getsentry.com/26645",
    // Number of transactions each page has in balance tab notifications
    transactions_per_page: 25,

    LOGOUT_WITH_REFRESH: true,
    MAX_WALLET_ATTEMPTS: 3,

    MAX_CONTACT_AGE: 24 * 60 * 60 * 1000 // One day in milliseconds.
};