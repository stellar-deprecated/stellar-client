/* exported Options */
window.Options = {
    server: {
        "trusted" : true,
        "websocket_ip" : "test.stellar.org",
        "websocket_port" : 9001,
        "websocket_ssl" : true
    },

    mixpanel: {
        "token": '',
        // Don't track events by default
        "track": false
    },

    INFLATION_DEST: 'g4eRqgZfzfj3132y17iaf2fp6HQj1gofjt',

    APP_ID: '1514787142083867',
    DOMAIN_NAME: 'stg.stellar.org',
    DEFAULT_FEDERATION_DOMAIN: 'stg.stellar.org',
    API_SERVER: 'https://api-stg.stellar.org',
    WALLET_SERVER: 'https://wallet-stg.stellar.org',

    // If set, login will persist across sessions (page reload). This is mostly
    // intended for developers, be careful about using this in a real setting.
    PERSISTENT_SESSION : false,
    DEFAULT_IDLE_LOGOUT_TIMEOUT : 15 * 60 * 1000, //15 minutes

    REPORT_ERRORS : true,
    SENTRY_DSN : "https://4574695240794dc090caaa3f2d02fd6c@app.getsentry.com/27687",
    // Number of transactions each page has in balance tab notifications
    TRANSACTIONS_PER_PAGE: 25,

    LOGOUT_WITH_REFRESH: true,
    MAX_WALLET_ATTEMPTS: 3,

    MAX_CONTACT_AGE: 24 * 60 * 60 * 1000, // One day in milliseconds.

    CAPTCHA_KEY: '6Ldj4PkSAAAAAL-kG23h3yRo0qSnO1BD3lr5zMEK',

    ANGULARTICS_WRITE_KEY: "K6D2s0Sjuu"
};
