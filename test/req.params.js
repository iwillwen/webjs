var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('req.params', function () {
  it('should return some data in the request url', function () {
    var app = web.create()
    app.get('/foo/:bar', function (req, res) {
      res.send(req.params.bar);
    });

    var test = new Tester(app);
    test.get('http://127.0.0.1/foo/foobar', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});