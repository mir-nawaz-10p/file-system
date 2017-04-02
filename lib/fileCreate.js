'use strict';

module.exports = function(req, res) {
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query))
  res.json(true);
};
