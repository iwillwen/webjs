var dataStream = require('dataStream');
var qs = require('querystring');
var http = require('http');

module.exports = test;

function test (app) {
  var server = http.createServer(app);
  this.target = server;
}

test.prototype.get = function (url, callback) {
  var res = new dataStream();
  res.on('complete', function (body) {
    callback(body);
  });
  res.headers = {};
  res.setHeader = res.header = function (key, value) {
    this.headers[key] = value;
  };
  res.sign = 'self';

  var req = new dataStream();
  req.method = 'GET';
  req.url = url;
  req.sign = 'self';

  this.target.emit('request', req, res);
  return this;
};

test.prototype.post = function (url, data, callback) {
  var res = new dataStream();
  res.on('complete', function (body) {
    callback(body);
  });
  res.headers = {};
  res.setHeader = function (key, value) {
    this.headers[key] = value;
  };
  res.setEncoding = function () {};
  res.sign = 'self';

  var req = new dataStream();
  req.setEncoding = function () {};
  if (data) {
    req.headers = {'content-type': 'application/x-www-form-urlencoded'};
    req.write(qs.stringify(data));
  }
  req.method = 'POST';
  req.url = url;
  req.sign = 'self';

  this.target.emit('request', req, res);
  if (data) req.end();
  return this;
};

test.prototype.request = function (method, url, data, callback) {
  var res = new dataStream();
  res.on('complete', function () {
    callback(res.body().toString());
  });
  res.headers = {};
  res.setHeader = res.header = function (key, value) {
    this.headers[key] = value;
  };
  res.setEncoding = function () {};
  res.sign = 'self';

  var req = new dataStream();
  req.setEncoding = function () {};
  if (data) {
    req.headers = {'content-type': 'application/x-www-form-urlencoded'};
    req.write(qs.stringify(data));
  }
  req.method = method.toUpperCase();
  req.url = url;
  req.sign = 'self';

  this.target.emit('request', req, res);
  if (data) req.ok().end();
  return this;
};