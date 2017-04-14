'use strict';

let http = require('http');
let express = require('express');
let lib = require('./lib');
let path = require('path');
let config = require('./config.json');
let bodyParser = require('body-parser');

let app = express();

global.dir = `${path.resolve(__dirname)}${config.rootDir}`;
global.host = `http://localhost:${config.port}/`;
global.home = __dirname;
global.webDir = `${__dirname}/web`;

app.use(express.static(global.dir));
app.use(express.static(global.webDir));

app.use(bodyParser.json({ limit: 10000000 }));
app.use(bodyParser.urlencoded({ extended: true }));

http.createServer(app).listen(config.port, function() {
  console.log(`Please open the link in your browser http://<YOUR-IP>: ${config.port}`);
});

app.get('/files', lib.get);

app.get('/challenge', lib.challenge);

app.get('/file', lib.fileDetails);

app.post('/create', lib.fileCreate);

app.post('/update', lib.fileUpdate);

app.get('/stats', lib.stats);

app.get('/', function(req, res) {
  res.redirect(`${global.webDir}/index.html`);
});
