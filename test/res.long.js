var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('res.sendfile', function () {
  it('should return some data in the request url', function () {
    var app = web.create();
    app.get('/', function (req, res) {
      res.long();
      res.send('f');
      res.send('o');
      res.send('o');
      res.send('b');
      res.send('a');
      res.send('r');
      res.end();
    });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('ffoooobbaarr', msg);
    });
  });
});