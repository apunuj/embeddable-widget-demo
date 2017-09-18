var http = require('http');
var express = require('express');
var os = require('os');
var ejs = require('ejs');

var serverPort = process.env.SERVER_PORT || 54100;
var clientPort = process.env.CLIENT_PORT || 54101;

var serverApp = express();
var clientApp = express();

http.createServer(serverApp).listen(serverPort);
http.createServer(clientApp).listen(clientPort);


var networkInterfaces = os.networkInterfaces();

function getIpAddress() {
  var keys = Object.keys(networkInterfaces);
  for (var x = 0; x < keys.length; ++x) {
    var netIf = networkInterfaces[keys[x]];
    for (var y = 0; y < netIf.length; ++y) {
      var addr = netIf[y];
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return '127.0.0.1';
}

var serverHost = '//'+getIpAddress()+':'+serverPort;
var platformScript = '/3rd/platform.js';


clientApp.set('view engine', 'html');
clientApp.engine('html', ejs.renderFile);
clientApp.get('/', function(req, res) {
  res.render('client/index', {
    serverHost: serverHost,
    platformScript: platformScript
  });
});

//Enabling CORS in the serverApp
serverApp.use(function(req, res, next) {
  console.log('cors middleware');
  if ((/^\/api\/3rd\/.+$/).test(req.path)) {
    var corsOrigin = req.headers.origin;
    var corsMethod = req.headers['access-control-request-method'];
    var corsHeaders = req.headers['acces-control-request-headers'];
    var hasACorsFlag = corsOrigin || corsMethod || corsHeaders;
    if (hasACorsFlag) {
      res.header('Access-Control-Allow-Origin', corsOrigin);
      res.header('Access-Control-Allow_Methods', corsMethod);
      res.header('Access-Control-Allow-Headers', corsHeaders);
      res.header('Access-Control-Max-Age', 60 * 60 * 24);
      if (req.method === 'OPTIONS') {
        res.send(200);
        return;
      }
    }
  }
  next();
});
