var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('req.query', function () {
  it('should return some data in the request query string', function () {
    var app = web.create()
    app
      .use(web.query())
      .get('/', function (req, res) {
        res.send(req.query.foo);
      });

    var test = new Tester(app);
    test.get('http://127.0.0.1/?foo=foobar', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});