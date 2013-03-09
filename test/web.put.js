var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.put', function () {
  it('should add a or some put method route handler', function () {
    var app = web.create();
    app.put('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.request('put', 'http://127.0.0.1/', null, function (msg) {
      assert.equal('foobar', msg);
    });
  });
});