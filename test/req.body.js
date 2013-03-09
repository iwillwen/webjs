var web = require('../');
var Tester = require('./require/test');
var assert = require("assert");

describe('req.body', function () {
  it('should return the data in the request', function () {
    var app = web.create();
    app
      .use(web.bodyParser())
      .post('/', function (req, res) {
        res.send(req.body.foo);
      });

    var test = new Tester(app);
    test.post('http://127.0.0.1/', { foo: 'foobar' }, function (msg) {
      assert.equal('foobar', msg);
    });
  });
});