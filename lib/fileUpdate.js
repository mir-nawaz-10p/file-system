'use strict';

let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let config = require('../config.json');
let request = require('request');

module.exports = function(req, res) {
  let pathServers = req.body.path,
  	  content = req.body.content,
  	  name = req.body.name;

  let details = _.split(pathServers, '&server=', 2),
  	  loc = path.join(global.dir, details[0]),
  	  servers = _.split(details[1], ',');

  let dir = loc.substr(0, loc.lastIndexOf('/'));
  let init = path.join(dir, 'init.json');

  if (fs.existsSync(init)) {
  	_readFile(init)
  	.then(function(data) {
  		data = JSON.parse(data);
  		for (let d of data) {
  			if (d.Name === name) {
  				d.UpdatedAt = Date.now();
  			}
  		}
  		return _updateFile(JSON.stringify(data, null, 2), init);
  	})
  	.then(function(res) {
  		if (fs.existsSync(loc)) {
		  	_updateFile(content, loc)
		  	.then(function(data) {});
		  }
  	});
  }
  
  let promises = [];
  for(let server of servers){
    let ser = _.find(config.servers, {name: server});
    if(ser){
      let url = `http://${ser.host}:${ser.port}/update`;
      let body = {
          path: details[0],
          content: content,
          name: name
      }
      promises.push(requestServer(url, body));
    }
  }
  
  Promise.all(promises).then(function(){});

  res.json(req.body);
};

function _readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', function(err, data) {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function _updateFile(content, path) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, content, function(err) {
		  if (err) return reject(err);
		  resolve(content);
    });
  });
}

function requestServer(url, body){
  return new Promise(function(resolve, reject){
    var options = { method: 'POST',
      url: url,
      body: body,
      json: true };

    request(options, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}