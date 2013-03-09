var web = require('../');
var assert = require('assert');

describe('web.meta', function () {
  it('should set a meta value on web', function () {
    web.meta({
      'foo': 'foo'
    });
    web.meta('bar', 'bar')
    assert.equal('foo', web.meta('foo'));
    assert.equal('bar', web.meta('bar'));
  });
});

describe('web.config', function () {
  it('should set a meta value on web', function () {
    web.config({
      'foo': 'foo'
    });
    web.config('bar', 'bar');
    assert.equal('foo', web.config('foo'));
    assert.equal('bar', web.config('bar'));
  });
});

describe('web.set', function () {
  it('should set a meta value on web', function () {
    web.set({
      'foo': 'foo'
    });
    web.set('bar', 'bar');
    assert.equal('foo', web.set('foo'));
    assert.equal('bar', web.set('bar'));
  });
});