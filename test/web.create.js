var web = require('../');
var Tester = require('./require/test');
var opt = require('./require/https-opt');
var assert = require("assert");

describe('web.create default', function () {
  it('should return a http server', function () {
    var app = web.create();
    app.get('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});

describe('web.create http', function () {
  it('should return a http server', function () {
    var app = web.create();
    app.get('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});

describe('web.create https', function () {
  it('should return a https server', function () {
    var app = web.create('https', opt);
    app.get('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.get('/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});