var http = require('http'),
    asynclist = require('asynclist');

var opts = {
  host: '127.0.0.1'
};
var list = [],
    succeed = 0,
    failed = 0;
for (var i = 0; i < 1001; i++)
  list.push(function () {
    http.get(opts, function (res) {
      res.on('end', function () {
        succeed++;
        tasks.trigger(true);
      });
    }).on('error', function (e) {
        console.log('error!');
        failed++;
        tasks.trigger(false);
    });
  });
var timeout = 0,
    timer = setInterval(function () {
      timeout++;
    }, 1);
var tasks = new asynclist(list);
tasks.assign(function () {
    clearInterval(timer);
    console.log('Finished. Used time: ' + timeout + 'ms');
}).run();