var web = require('../');
var assert = require("assert");

describe('web', function () {
  it('should inherit from event emitter', function (done) {
    web.on('foo', done);
    web.emit('foo');
  });
});