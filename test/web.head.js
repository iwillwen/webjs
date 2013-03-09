var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.head', function () {
  it('should add a or some head method route handler', function () {
    var app = web.create();
    app.head('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.request('head', 'http://127.0.0.1/', null, function (msg) {
      assert.equal('foobar', msg);
    });
  });
});