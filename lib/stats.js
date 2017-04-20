'use strict';

let fs = require('fs');
let path = require('path');
let config = require('../config.json');
let _ = require('lodash');

module.exports = function(req, res) {
  let files = {
    config: config,
    stats: {}
  };
  let rootList = [];
  let dir = global.dir + '/';
  let rootInit = dir + 'init.json';

  if (fs.existsSync(rootInit)) {
      rootList.push('/');
      rootList['/'] = JSON.parse(fs.readFileSync(rootInit, 'utf8')); 
  }

  let target = walkSync(dir, rootList);
  
  for (let k in target) {
    files.stats[k] = target[k];
  }
  res.json(files);
};

function walkSync(dir, filelist) {
  var fs = fs || require('fs'),
    files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + file).isDirectory()) {
      let currentDir = dir + file + '/';
      filelist.push(_.split(currentDir, global.dir, 2)[1]);
      filelist[currentDir.split(global.dir)[1]] = JSON.parse(fs.readFileSync(currentDir + 'init.json', 'utf8'));
      filelist = walkSync(currentDir, filelist);
    }
  });
  return filelist;
};
