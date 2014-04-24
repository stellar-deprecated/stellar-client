var www = require('../app');
var winston = require('winston');

winston.add(winston.transports.File, { filename: 'stellar-client.log' });
winston.info('Starting stellar-client giveaway server...');

www.start();
