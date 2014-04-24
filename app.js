var express = require('express');
var ExpressBrute = require('express-brute');
var bodyParser = require('body-parser');

var config = require('./config-example');

var https = require('https');
var http = require('http');

var winston = require('winston');

var www = {};

var store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
var bruteforce = new ExpressBrute(store,config.EXPRESS_BRUTE_OPTIONS);
var app = express();

if(config.HTTPS_ON) app.use(requireHTTPS);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

function requireHTTPS(req, res, next){
    if(!req.secure){
        return res.redirect('https://' + config.DOMAIN_NAME + req.url);
    }
    next();
}

www.start=function()
{
    http.createServer(app).listen(config.HTTP_PORT);
    if(config.HTTPS_ON){
        var options = {
            key: fs.readFileSync(config.HTTPS_KEY),
            cert: fs.readFileSync(config.HTTPS_CERT),
            ca: fs.readFileSync(config.HTTPS_CA_CERT)
        };
        https.createServer(options, app).listen(config.HTTPS_PORT);
        winston.info('Listening on ports ' + config.HTTP_PORT + ' ' + config.HTTPS_PORT);
    } else winston.info('Listening on port ' + config.HTTP_PORT);
}

module.exports = www;
