var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('res.sendJSON', function () {
  it('should return some data in the request url', function () {
    var app = web.create();
    app.get('/', function (req, res) {
      res.sendJSON({ 'data': 'foobar' });
    });

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('foobar', JSON.parse(msg).data);
    });
  });
});