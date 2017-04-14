'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');

module.exports = function(req, res) {
  let target = walkSync(global.dir + '/');
  let files = {};
  for (let k in target) {
    files[k] = target[k];
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
