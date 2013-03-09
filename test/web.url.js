var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('web.url', function () {
  it('should return some data in the request url', function () {
    var app = web.create();
    app.url('/', 'http://google.com');

    var test = new Tester(app);
    test.get('http://127.0.0.1/', function (msg) {
      assert.equal('', msg);
    });
  });
});