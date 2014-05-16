'use strict';

var config = angular.module('config', []);

// Persistent sessions should only be used for development.
config.constant('PERSISTENT_SESSION', true);
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
