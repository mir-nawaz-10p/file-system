'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let config = require('../config.json');

module.exports = function(req, res) {

	delete require.cache[require.resolve('../config.json')];
	config = require('../config.json');

	if(req.body.replicate){
		config.replicate = req.body.replicate;
	}

	var server = req.body.server;

  var host = _.find(config.servers, {name: server.name});
	
	if(!host){
		var host = {
			name: server.name,
			host: server.host,
			port: server.port,
			cost: server.cost,
			live: server.live
		}
		config.servers.push(host);
	}
	else{
		_.remove(config.servers, {name: server.name})
		host.live = true;
		host.cost = config.cost;
		config.servers.push(host);
	}

	fs.writeFile(path.join(global.home, 'config.json'), JSON.stringify(config, null, 2), function(err) {});
  res.json(true);
};
