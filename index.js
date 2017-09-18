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
