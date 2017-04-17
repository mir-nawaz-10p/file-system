'use strict';

let _ = require('lodash');
let path = require('path');
let fs = require('fs');
let config = require('../config.json');
let request = require('request');

module.exports = function(req, res, next) {
  let location = req.body.path,
      type = req.body.type,
      name = req.body.name,
      servers = req.body.servers || getActiveServers(_.sortBy(config.servers, ['cost'])),
      replicate = req.body.replicate, 
      callAll = req.body.callAll;

  let promises = [];
  let init = path.join(global.dir, location, 'init.json');
  location = path.join(global.dir, location, name);

  if (fs.existsSync(location)) {
    res.status(500).send(`${name} already exists`);
  }

  if(type === 'file' && replicate) {
    createFile(location, ' ')
    .then(() => _readFile(init))
    .then(function(dataTable){
      dataTable = JSON.parse(dataTable);
      dataTable.push({
        Name: name,
        Server: servers,
        Edit: false,
        CreatedAt: Date.now(),
        UpdatedAt: Date.now()
      });
      return _updateFile(JSON.stringify(dataTable, null, 2), init);
    });
  }
  else if(type === 'file' && !replicate) {
    _readFile(init)
    .then(function(dataTable){
      dataTable = JSON.parse(dataTable);
      dataTable.push({
        Name: name,
        Server: servers,
        Edit: false,
        CreatedAt: Date.now(),
        UpdatedAt: Date.now()
      });
      return _updateFile(JSON.stringify(dataTable, null, 2), init);
    });
  }
  else if(type === 'directory') {
    createFolder(location)
    .then(function(){
      _.remove(config.servers, {name: config.name});
      _.remove(config.servers, {live: false});
      for(let server of config.servers){
        var url = `http://${server.host}:${server.port}/create`;
        var body = {
          path: req.body.path,
          type: type,
          name: name,
          servers: servers,
          replicate: true,
          callAll: false
        };
        promises.push(requestServer(url, body));
      }
      Promise.all(promises)
      .then(function(res){})
      .catch(function(err){});
    });
  }
  
  if(type === 'file' && callAll){
    _.remove(config.servers, {name: config.name});
    _.remove(config.servers, {live: false});
    for(let server of config.servers){
      var url , body ;
        if(servers.indexOf(server.name) >= 0){
          url = `http://${server.host}:${server.port}/create`;
          body = {
            path: req.body.path,
            type: type,
            name: name,
            servers: servers,
            replicate: true,
            callAll: false
          }
        }
        else{
          url = `http://${server.host}:${server.port}/create`;
          body = {
            path: req.body.path,
            type: type,
            name: name,
            servers: servers,
            replicate: false,
            callAll: false
          }
        }
      promises.push(requestServer(url, body));
    }
    Promise.all(promises)
    .then(function(res){
    })
    .catch(function(err){
    });
  }
  res.json(req.body);
};


function createFile(location, content){
  return new Promise(function(resolve, reject){
    if(!fs.existsSync(location)){
      fs.writeFile(location, content, function(err) {
        if(err) reject(err);
        resolve('created')
      });
    }
    else{
      return new Promise.resolve();      
    }
  })
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

function getActiveServers(servers){
  let hosts = [config.name];
   _.remove(servers, {name: config.name});
   servers = _.filter(servers, {live: true});
   servers = _.slice(servers, 0, config.replicate - 1);
   for(let server of servers){
    hosts.push(server.name);
   }
   return hosts;
 }


 function createFolder(location){
  if(!fs.existsSync(location)){
    fs.mkdirSync(location);
    return createFile(path.join(location, 'init.json'), '[]');
  }
  else{
    return new Promise.resolve();
  }
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