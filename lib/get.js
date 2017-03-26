'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');

module.exports = function(req, res) {

    let currentDir = global.dir;
    let query = req.query.path || '';

    if (query) currentDir = path.join(global.dir, query);
    
    fs.readdir(currentDir, function(err, files) {
        if (err) {
            throw err;
        }
        let data = [];
        files.filter(function(file) {return true;})
        .forEach(function(file) {
            try {
                let isDirectory = fs.statSync(path.join(currentDir, file)).isDirectory();
                if (isDirectory) {
                    data.push({ Name: file, IsDirectory: true, Path: path.join(query, file) });
                }
                else {
                    let ext = path.extname(file);
                    if(file === 'init.json'){
                      let files = JSON.parse(fs.readFileSync(currentDir+'/init.json'));
                      for(let file of files){
                        data.push({
                            Name: file.Name,
                            Ext: path.extname(file.Name),
                            IsDirectory: false,
                            Path: `${path.join(query, file.Name)}&server=${file.Server.join(',')}`
                        });
                      }
                      return;
                    }
                    data.push({ Name: file, Ext: ext, IsDirectory: false, Path: path.join(query, file) });
                }

            }
            catch (e) {
                console.log(e);
            }

        });
        data = _.sortBy(data, function(f) { return f.Name; });
        res.json(data);
    });
}
