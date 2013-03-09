var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.post', function () {
  it('should add a or some post method route handler', function () {
    var app = web.create();
    app.post('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.post('http://127.0.0.1/', null, function (msg) {
      assert.equal('foobar', msg);
    })
  });
});