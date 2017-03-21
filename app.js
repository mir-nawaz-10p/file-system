'use strict';

let http = require('http');
let _ = require('lodash');
let express = require('express');
let fs = require('fs');
let path = require('path');
let util = require('util');

let program = require('commander');

function collect(val, memo) {
  if (val && val.indexOf('.') != 0) val = '.' + val;
  memo.push(val);
  return memo;
}

program
  .option('-p, --port <port>', 'Port to run the file-browser. Default value is 3000')
  .option('-e, --exclude <exclude>', 'File extensions to exclude. To exclude multiple extension pass -e multiple times. e.g. ( -e .js -e .cs -e .swp) ', collect, [])
  .parse(process.argv);

let app = express();
let dir = process.cwd();
app.use(express.static(dir)); // app public directory
app.use(express.static(__dirname)); // module directory
let server = http.createServer(app);

if (!program.port) program.port = 3000;

server.listen(program.port);
console.log('Please open the link in your browser http://<YOUR-IP>:' + program.port);

app.get('/files', function(req, res) {
  let currentDir = dir;
  let query = req.query.path || '';
  if (query) currentDir = path.join(dir, query);
  console.log('browsing ', currentDir);
  fs.readdir(currentDir, function(err, files) {
    if (err) {
      throw err;
    }
    let data = [];
    files
      .filter(function(file) {
        return true;
      }).forEach(function(file) {
        try {
                // console.log("processing ", file);
          let isDirectory = fs.statSync(path.join(currentDir, file)).isDirectory();
          if (isDirectory) {
            data.push({ Name: file, IsDirectory: true, Path: path.join(query, file) });
          }
          else {
            let ext = path.extname(file);
            if (program.exclude && _.contains(program.exclude, ext)) {
              console.log('excluding file ', file);
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
});

app.get('/', function(req, res) {
  res.redirect('web/index.html');
});
