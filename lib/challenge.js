'use strict';

let config = require('../config.json');

module.exports = function(req, res) {
	try{
		delete require.cache[require.resolve('../config.json')];
		config = require('../config.json');
		res.json(config.servers);
	}
	catch(e){
		console.log(e);
		res.send(false);
	}
};
