var http = require('http');
var os = require('os');
var fs = require('fs');
var path = require('path');

var express = require('express');
var ejs = require('ejs');
var body_parser = require('body-parser');

var serverPort = process.env.SERVER_PORT || 54100;
var clientPort = process.env.CLIENT_PORT || 54101;

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

var serverHostSansProtocol = ''+getIpAddress()+':'+serverPort;
var clientHostSansProtocol = ''+getIpAddress()+':'+clientPort;
var serverHost = '//'+serverHostSansProtocol;

var platformWidgetInitPathTemplate = '/3rd/:platform/widget-init.html';
var platformScriptPathTemplate = '/3rd/:platform/platform.js';
var platformStylePathTemplate = __dirname+'/views/server/3rd/:platform/platform.css';
var platformScript = '/3rd/foo/platform.js';

var demo3rdPartyId = 1122334455;
var demo3rdPartyAllowedHostsFixtures = {
  '1122334455': [ clientHostSansProtocol ]
};

//Platform server
var serverApp = express();
serverApp.use(body_parser.json());

function isValidPartyId(partyId) {
  return partyId && partyId.length === 10;
}

function isOriginAllowedForThisPartyId(origin, partyId) {
  var allowedHostsForParty = demo3rdPartyAllowedHostsFixtures[''+partyId];
  if (Array.isArray(allowedHostsForParty)) {
    var hostSansProtocol = origin.split('//');
    hostSansProtocol = hostSansProtocol[hostSansProtocol.length - 1];
    console.log(hostSansProtocol);
    return (allowedHostsForParty.indexOf(hostSansProtocol) >= 0);
  }
  else {
    return false;
  }
}

//enable CORS
serverApp.use(function(req, res, next) {
  //only for paths that come under /api/3rd
  if ((/^\/api\/3rd\/.+$/).test(req.path)) {
    var partyId = req.query.partyId;
    if ( !isValidPartyId(partyId)) {
      res.status(403).end();
      return;
    }
    var corsOrigin = req.headers.origin;
    var corsMethod = req.headers['access-control-request-method'];
    var corsHeaders = req.headers['acces-control-request-headers'];
    var hasACorsFlag = corsOrigin || corsMethod || corsHeaders;
    if (hasACorsFlag) {

      if(req.method !== 'OPTIONS') {
        if ( !isOriginAllowedForThisPartyId((corsOrigin || ''), partyId)) {
          res.status(403).end();
          return;
        }
      }

      res.header('Access-Control-Allow-Origin', corsOrigin);
      res.header('Access-Control-Allow-Methods', corsMethod);
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

//serve platform script file
serverApp.set('view engine', 'html');
serverApp.engine('html', ejs.renderFile);
serverApp.engine('js', ejs.renderFile);

//Serving the platform script
serverApp.get(platformScriptPathTemplate, function(req, res) {
  var partyId = req.query.partyId;
  var platformScriptPath = platformScriptPathTemplate.replace(':platform', req.params.platform);
  var platformStylePath = platformStylePathTemplate.replace(':platform', req.params.platform);

  fs.readFile(path.normalize(platformStylePath), function(err, data) {
    data = ((!err && data && data.toString()) || '').replace(/(?:\r\n|\r|\n)/g, ' ');
    res.render('server'+platformScriptPath, {
      partyId: partyId,
      serverHost: serverHost,
      platformScript: platformScriptPath,
      inlineCss: data
    });
  });
});


//Respond to API requests from widgets
serverApp.get('/api/3rd/:platform/widget/:id/init', function(req, res) {
  var id = req.params.id;
  var partyId = req.query.partyId;
  var platformWidgetInitPath = platformWidgetInitPathTemplate.replace(':platform', req.params.platform);
  res.render('server'+platformWidgetInitPath, {
    id: id,
    partyId: partyId,
    serverHost: serverHost
  });
});

serverApp.post('/api/3rd/:platform/widget/:id/:action', function(req, res) {
  var id = req.params.id;
  var action = req.params.action;
  var partyId = req.query.partyId;
  var platformWidgetInitPath = platformWidgetInitPathTemplate.replace(':platform', req.params.platform);
  res.send({
    action: req.params.action,
    success: true,
    content: req.body
  });
});
serverApp.use(express.static('server'));


//3rd party using widgets served by platform server
var clientApp = express();

clientApp.set('view engine', 'html');
clientApp.engine('html', ejs.renderFile);
/*clientApp.get('/favicon.ico', function(req, res) {
    res.status(404).end();
});*/

clientApp.get('/:platform/', function(req, res) {
  var platformScriptPath = platformScriptPathTemplate.replace(':platform', req.params.platform);
  res.render('client/'+req.params.platform+'/index', {
    partyId: demo3rdPartyId,
    serverHost: serverHost,
    platformScript: platformScriptPath
  });
});


serverApp.listen(serverPort, function() {
  console.log("Server App is up!");
});

clientApp.listen(clientPort, function() {
  console.log("Client App is up!");
});
