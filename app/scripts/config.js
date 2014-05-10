'use strict';

var config = angular.module('config', [])
  .constant('API_LOCATION', 'http://localhost:80')
  .constant('BLOB_LOCATION', 'http://localhost:80/blob')
;
