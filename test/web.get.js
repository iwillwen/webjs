var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.get', function () {
  it('should add a or some get method route handler', function () {
    var app = web.create();
    app.get('/', function (req, res) {
      res.send('foobar');
    });

    var test = new Tester(app);
    test.get('/', function (msg) {
      assert.equal('foobar', msg);
    });
  });
});