var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.use default', function () {
  it('should add a middlewares', function () {
    var app = web.create();
    app
      .use(function (req, res, next) {
        res.data = 'foobar';
        next();
      })
      .get('/', function (req, res) {
        res.send(res.data);
      });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});

describe('web.use route', function () {
  it('should add a or some middlewares on designated route', function () {
    var app = web.create();
    app
      .use('/foo', function (req, res, next) {
        res.data = 'foobar';
        next();
      })
      .get('/foo', function (req, res) {
        res.send(res.data);
      });

    var test = new Tester(app);
    test.get('/foo', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});

describe('web.use mulit', function () {
  it('should add some middlewares on designated route', function () {
    var app = web.create();
    app
      .use(
        function (req, res, next) {
          res.data1 = 'foo';
          next();
        },
        function (req, res, next) {
          res.data2 = 'bar';
          next();
        }
      )
      .get('/*', function (req, res) {
        res.send(res.data1 + res.data2);
      });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});