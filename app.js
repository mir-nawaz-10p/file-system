'use strict';

let http = require('http');
let express = require('express');
let lib = require('./lib');
let path = require('path');
let config = require('./config.json');
let bodyParser = require('body-parser');
let request = require('request');
let fs = require('fs');
let _ = require('lodash');
let cron = require('node-cron');
let rmdir = require('rmdir');

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

app.post('/delete', lib.deleteFile);

app.post('/config', lib.updateConfig);

app.get('/stats', lib.stats);

app.get('/', function(req, res) {
  res.redirect(`${global.webDir}/index.html`);
});


getStats()
.then(function(res){
	let folders = JSON.parse(res).stats;
	let remoteStats = []; 
	let localStats = [];
	updateConfig()
	.then(function(){
		let hosts = JSON.parse(res).config;
		let newHosts = [];
		for(let host of hosts){
			if(!_.find(config.servers, {name: host.name})){
				newHosts.push(host);
			}
		}
		config.servers.concat(newHosts);
		fs.writeFile(path.join(global.home, 'config.json'), JSON.stringify(config, null, 2), function(){});
	});
	_getLocalStats()
	.then(function(_localStats){
		localStats = _localStats;
		for (let name in folders) {
		  if(!_.isNaN(+name)){
		  	let dir = global.dir+folders[name];
		  	remoteStats.push(dir);
		  	if (!fs.existsSync(dir)) {
			  	fs.mkdirSync(dir);
			  	fs.writeFileSync(dir+'init.json', '[]');
				}
		  }
		  if(typeof folders[name] === 'object' && folders[name].length > 0){
	  		let dir = global.dir+name;
	  		let initFile = dir+'init.json';
	  		if(!fs.existsSync(initFile)){
	  			fs.writeFileSync(dir+'init.json', '[]');
	  		}
	  		fs.writeFileSync(dir+'init.json', JSON.stringify(folders[name], null, 2));
	  		for(let file of folders[name]){
	  			let fileDir = dir+file.Name;
	  			remoteStats.push(fileDir);
	  			let servers = file.Server;
	  			let index = _.indexOf(servers, config.name);
	  			if(index >= 0){
	  				servers.splice(index, 1);
	  				let filePath = name+file.Name;
	  				filePath = filePath.slice(0,0) + filePath.slice(1);
	  				getFileContent(servers, filePath, function(err, res){
	  						if(err){
	  							console.log(err);
	  						} 
	  						else{
	  							fs.writeFileSync(fileDir, res);
	  						}
	  				});
	  			}
	  		}
	  	}
		}
		let fldrs = _.difference(localStats, remoteStats);
		for(let fldr of fldrs){
			fldr = fldr.slice(0, -1);
			if(fs.existsSync(fldr)){
				rmdir(fldr, function (err, dirs, files) {});
			}
		}
		console.log("Sync Complete");
	});
})
.catch(function(err){
updateConfig();
console.log(err);
});

function getStats(){
	return new Promise(function(resolve, reject){
		let servers = _.filter(config.servers, {live: true});
		_.remove(servers, {name: config.name});
		servers = _.sortBy(servers, ['cost']);
		_stats(servers, function(err, res){
			if(err) reject(err);
			resolve(res);
		});
	});
}

function _stats(servers, callback){
	if (servers.length === 0) {
    	return callback('No Server live for Sync ... ');
  	}
	let server = servers[0];
	let options = {
	      method: 'GET',
				url: `http://${server.host}:${server.port}/stats`
		};
  request(options, function(error, response, body) {
		  if (error) {
		  	servers.shift();
      _stats(servers, callback);
		  }
		  else{
		  	return callback(undefined, body);
		  }
  });
}


function getFileContent(servers, pathname, callback) {
  
  let length = servers.length;

  if (servers.length === 0) {
    callback('No Server live ...', undefined);
  }
  else {
    let hostConfig = _.find(config.servers, { name: servers[0], live: true });
    if (!hostConfig) {
      servers.shift();
      getFileContent(servers, pathname, callback);
    }
    else {
      let options = {
	        method: 'GET',
			url: `http://${hostConfig.host}:${hostConfig.port}/file`,
			qs: { path: pathname }
		};
	  request(options, function(error, response, body) {
		  if (error || body.indexOf('Not found') >= 0) {
		  	servers.shift();
	  		getFileContent(servers, pathname, callback);
		  }
		  else {
	  		callback(undefined, body);
		  }
	  });
    }
  }

}

function updateConfig(){
	return new Promise(function(resolve){
		var current = _.find(config.servers, {name: config.name});
		if(!current){
			current = {
				name: config.name,
				host: config.host,
				port: config.port,
				cost: config.cost,
				live: true
			}
			config.servers.push(current);
		}
		else{
			_.remove(config.servers, {name: config.name})
			current.live = true;
			current.cost = config.cost;
			config.servers.push(current);
		}
		fs.writeFile(path.join(global.home, 'config.json'), JSON.stringify(config, null, 2), function(err) {
			updateServersConfig(config.servers, current);
			resolve(true)
		});
	});
}

function requestServer(url, body){
  return new Promise(function(resolve, reject){
    var options = { 
    	method: 'POST',
      url: url,
      body: body,
      json: true };

    request(options, function (error, response, body) {
      if (error) reject(error);
      resolve(body);
    });
  });
}


function updateServersConfig(servers, current){
	_.remove(servers, {name: config.name});
	let promises = [];
	for(let server of servers){
		var url = `http://${server.host}:${server.port}/config`;
	    var body = {
	      replicate: config.replicate,
	      server: current
	    }
    	promises.push(requestServer(url, body));
	}	
	Promise.all(promises).then().catch();
}

cron.schedule('*/10 * * * * *', function(){
	delete require.cache[require.resolve('./config.json')];
  config = require('./config.json');
  _.remove(config.servers, {name: config.name});
  for(let server of config.servers){
  	let url = `http://${server.host}:${server.port}/challenge`;
  	heartBeat(url, config, server)
  	.then(function(res){
  		if(res){
				config.servers = _.concat(config.servers, _.differenceBy(JSON.parse(res), config.servers, 'name'));
  		}
  		else{
  			for(let host of config.servers){
  				if(host.name === server.name){
  					host.live = false;
  				}
  			}
  		}
  		fs.writeFile(path.join(global.home, 'config.json'), JSON.stringify(config, null, 2), function(err) {});
  	});
  }
});


function heartBeat(url, config, server){
  return new Promise(function(resolve, reject){
  	if(config.name === server.name){
  		resolve(false);
  		return;
  	}
    var options = { method: 'GET', url: url};
    request(options, function (error, response, body) {
      if (error) resolve(false);
      resolve(body);
    });
  });
}

function _getLocalStats(){
	return new Promise(function(resolve, reject){
			let options = {
	      method: 'GET',
				url: `http://${config.host}:${config.port}/stats`
		};
	  request(options, function(error, response, body) {
	  	if (error) reject(false);
  		let localStats = [];
		  let folders = JSON.parse(body).stats;
		  for (let name in folders) {
			  if(!_.isNaN(+name)){
			  	let dir = global.dir+folders[name];
			  	localStats.push(dir);
			  }
			  if(typeof folders[name] === 'object' && folders[name].length > 0){
		  		let dir = global.dir+name;
		  		let initFile = dir+'init.json';
		  		if(!fs.existsSync(initFile)){
		  			fs.writeFileSync(dir+'init.json', '[]');
		  		}
		  		fs.writeFileSync(dir+'init.json', JSON.stringify(folders[name], null, 2));
		  		for(let file of folders[name]){
		  			let fileDir = dir+file.Name;
		  			localStats.push(fileDir);
		  		}
			  }
			}
			resolve(localStats);
	  });
	});
}