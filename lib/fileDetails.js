'use strict';

const fs = require('fs');
const path = require('path');
const request = require('request');
const _ = require('lodash');

const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
};

module.exports = function(req, res) {

  let query = req.query;
  let pathname = global.dir + '/' + query.path;

  if (query.server) {

    let servers = query.server.split(',');
    serverRequest(servers, query, res);
  }
  else {
    fs.readFile(pathname, function(err, data) {
	      if (err) {
	          res.statusCode = 500;
	          res.end(`Error getting the file: ${err}.`);
	      }
      else {
	          const ext = path.parse(pathname).ext;
	          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
	          res.end(data);
	      }
	  	});
  }
};

function serverRequest(servers, query, res) {
  let config = JSON.parse(fs.readFileSync(global.home + '/config.json'));
  let length = servers.length;

  if (servers.length === 0) {
    res.send('Error getting the file: ' + query.path);
  }
  else {
    let hostConfig = _.find(config.servers, { name: servers[0], live: true });

    if (!hostConfig) {
      servers.shift();
      serverRequest(servers, query, res);
    }
    else {
      let options = {
        method: 'GET',
		  				url: `http://${hostConfig.host}:${hostConfig.port}/file`,
		  				qs: { path: query.path }
		   			};

      request(options, function(error, response, body) {
			  if (error) {
			  	servers.shift();
          serverRequest(servers, query, res);
			  }
			  else {
          	res.end(body);
			  }
      });
    }
  }

}
