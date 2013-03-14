var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.delete', function () {
  it('should add a or some del method route handler', function () {
    var app = web.create();
    app.delete('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.request('delete', 'http://127.0.0.1/', null, function (msg) {
      assert.equal('foobar', msg);
    });
  });
});