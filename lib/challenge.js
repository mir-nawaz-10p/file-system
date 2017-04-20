'use strict';

let config = require('../config.json');

module.exports = function(req, res) {
	delete require.cache[require.resolve('../config.json')];
	config = require('../config.json');
	res.json(config.servers);
};
