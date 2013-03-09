var http = require('http');
var web = require('./index.js');


function ask () {
  var req = http.request({
    host: '127.0.0.1',
    port: '45678',
    path: '/getQuerystring',
    method: 'get'
  });

  req.on('response',function (res) {
    res.on('data',function (chunk) {
      console.log('body:' + chunk);   
    });
  });
  req.end();
}


var getRouter = {
  'name/:name': function (req, res) {
    res.send('Hey! Mr. ' + decodeURI(req.params.name) + '! Nice to meet you.');
  },
  'getQuerystring' : function (req, res) {
    res.sendJSON(req.query);
  }
};


web.run(45678);
ask();
setTimeout(function () {
  web.use(web.query)
    .get(getRouter);
  ask();
}, 3000);

var util  = require('util'),
  spawn = require('child_process').spawn,
  ls    = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ls.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});