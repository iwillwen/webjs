var web = require('../');
var assert = require("assert");

describe('web.run default', function () {
  it('should start a http server on 80 port', function () {
    var g = function (port, host) {
      assert.equal(80, port);
      web.removeListener('listening', g);
    };

    web.on('listening', g);
    web.run();
  });
});

describe('web.run port', function () {
  it('should start a http server on designated port', function () {
    var port = Math.floor(Math.random() * 100);
    var g = function (_port) {
      assert.equal(port, _port);
      web.removeListener('listening', g);
    };

    web.on('listening', g);
    web.run(port);
  });
});

describe('web.run host', function () {
  it('should start a http server on designated host', function () {
    var port = Math.floor(Math.random() * 100);
    var g = function (port, _host) {
      assert.equal('localhost', _host);
      web.removeListener('listening', g);
    };
    
    web.on('listening', g);
    web.run(port, 'localhost');
  });
});