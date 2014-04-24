// rename config.js and set up how you need it

var config = {};

config.HTTP_PORT = 80;
config.HTTPS_PORT = 443;
config.HTTPS_ON = false;
config.HTTPS_KEY ='test/fixtures/keys/agent2-key.pem';
config.HTTPS_CERT = 'test/fixtures/keys/agent2-cert.pem';
config.HTTPS_CA_CERT = '';

config.DOMAIN_NAME = "stellar.org";

config.FB_START_DATE=1394046049000;
config.FB_DOLE_AMOUNT=20000;
config.FB_MAX_TODAY=110;

config.EXPRESS_BRUTE_OPTIONS=
{
    proxyDepth: 0,
    minWait: 500,
    maxWait: 15*60*1000,
    // lifetime: 24*60*60
    freeRetries: 10
};

module.exports = config;
