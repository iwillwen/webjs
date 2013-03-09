var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('res.sendfile', function () {
  it('should return some data in the request url', function () {
    var app = web.create();
    app
      .use(web.query())
      .get('/', function (req, res) {
        res.sendJSONP({ data: 'foobar' });
      });

    var test = new Tester(app);
    test.get('http://127.0.0.1/?callback=callback', function (msg) {
      function callback (json) {
        assert.equal('foobar', json.data);
      }
      eval(msg);
    });
  });
});