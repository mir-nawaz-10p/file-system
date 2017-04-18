'use strict';

let _ = require('lodash');
let config = require('../config.json');
let path = require('path');
let request = require('request');
let rmdir = require('rmdir');
let fs = require('fs');

module.exports = function(req, res, next) {
	let pathname = _.split(req.body.path, '&')[0],
	isDirectory = req.body.isDirectory,
	callAll = req.body.callAll;

	let dir = path.join(global.dir, pathname);

	if(callAll){
		let servers = config.servers;
		_.remove(servers, {name: config.name});
		let promises = [];
		for (let server of servers){
			var url = `http://${server.host}:${server.port}/delete`;
      var body = {
        path: req.body.path,
        isDirectory: req.body.isDirectory,
        callAll: false
      };
      promises.push(requestServer(url, body));
		}
		Promise.all(promises)
		.then()
		.catch();

		deleteList(isDirectory, dir);
	}
	else{
		deleteList(isDirectory, dir);
	}
	res.send('file deleted');
};


function deleteList(isDirectory, pathname){
	if(isDirectory === 'true'){
		rmdir(pathname, function (err, dirs, files) {});
	}
	else{
		var idx = pathname.lastIndexOf("/");
		let fileName = pathname.substr(idx+1); 
    var init = path.join(pathname.substr(0, idx), 'init.json');
    if(fs.existsSync(init)){
				_readFile(init)
				.then(function(content){
					content = JSON.parse(content);
					_.remove(content, {Name: fileName});
					return _updateFile(JSON.stringify(content, null, 2), init)
				})
				.then(function(){
				if(fs.existsSync(pathname)){
					fs.unlinkSync(pathname);
				}
			});
		}
	}
}


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