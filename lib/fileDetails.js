'use strict';

let fs = require('fs');
let path = require('path');
let request = require('request');
let _ = require('lodash');
let config = require('../config.json');

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
  
  delete require.cache[require.resolve('../config.json')];
  config = require('../config.json');
  
  let query = req.query;
  let pathname = global.dir + '/' + query.path;

  if (query.server) {

    let servers = query.server.split(',');
    let config = JSON.parse(fs.readFileSync(global.home + '/config.json'));
    
    // sort with cost of server
    let hosts = _.sortBy(config.servers, ['cost']);
    let sorted = [];
    for(let host of hosts){
      if(servers.indexOf(host.name) >= 0){
        sorted.push(host.name);
      }
    }
    servers = sorted;
   
    if(servers.indexOf(config.name) >= 0){
      fs.readFile(pathname, function(err, data) {
        if (err) {
          servers = _.without(servers, config.name);
          serverRequest(servers, query, res, config);
        }
        else {
            const ext = path.parse(pathname).ext;
            res.setHeader('Content-type', mimeType[ext] || 'text/plain');
            res.end(data);
        }
      });

    }
    else{
      serverRequest(servers, query, res, config);
    }
  }
  else {
    fs.readFile(pathname, function(err, data) {
	      if (err) {
	          res.status(404).send('Not found');
	      }
      else {
	          const ext = path.parse(pathname).ext;
	          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
	          res.end(data);
	      }
	  	});
  }
};

function serverRequest(servers, query, res, config) {
  
  let length = servers.length;

  if (servers.length === 0) {
    res.send('Error getting the file: ' + query.path);
  }
  else {
    let hostConfig = _.find(config.servers, { name: servers[0], live: true });

    if (!hostConfig) {
      servers.shift();
      serverRequest(servers, query, res, config);
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
          serverRequest(servers, query, res, config);
			  }
			  else {
          	res.end(body);
			  }
      });
    }
  }

}
