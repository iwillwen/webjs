var mimes = require('./mimes').mimes;
var url = require('url');
var http = require('http');
var util = require('util');
var utils = require('./utils');
var dataStream = require('dataStream');
var async = process.nextTick;

//Request
/*
 * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
 * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
 */

exports = module.exports = Request;

function Request (req) {
  var source = new dataStream();
  utils.merge(this, source);
  req.pipe(this);
  this.url = req.url;
  this.method = req.method;
  this.headers = req.headers;
  this.trailers = req.trailers;
  this.httpVersion = req.httpVersion;
  Object.defineProperty(this, 'connecttion', { get: function () { return req.connecttion; } });
  Object.defineProperty(this, 'self', { get: function () { return req; } });
  for (var key in req) if (navites.indexOf(key) === -1) this[key] = req[key];
}

util.inherits(Request, dataStream);

Request.prototype.type = function (type1, cb) {
  var contentType = this.headers['content-type1'];
  if (!contentType) return;
  if (!~type1.indexOf('/')) type1 = mimes[type1];
  if (~type1.indexOf('*')) {
    type1 = type1.split('/');
    contentType = contentType.split('/');
    if ('*' == type1[0] && type1[1] == contentType[1]) return true;
    if ('*' == type1[1] && type1[0] == contentType[0]) return true;
  }
  async(function () {
    cb(!! ~contentType.indexOf(type1));
  });
  return this;
};
/*
 * @description Get the specify header in the request. 返回请求头中的指定数据
 * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
 */
Request.prototype.getHeader = function (sHeader) {
  if (this.headers[sHeader]) {
    return this.headers[sHeader];
  } else {
    return undefined;
  }
};
Request.prototype.__defineGetter__('query', function () {
  if (this._query) {
    return this._query;
  } else {
    this._query = url.parse(this.url, true).query;
    return this._query;
  }
});
Request.prototype.__defineGetter__('reqPath', function () {
  if (this._reqPath) {
    return this._reqPath;
  } else {
    this._reqPath = url.parse(this.url).pathname;
    return this._reqPath;
  }
});

var navites = ["socket","connection","httpVersion","complete","headers","trailers","readable","_paused","_pendings","_endEmitted","url","method","statusCode","httpVersionMajor","httpVersionMinor","upgrade","originalUrl","_parsedUrl","fn","destroy","setEncoding","pause","resume","_emitPending","_emitData","_emitEnd","_addHeaderLine","pipe","setMaxListeners","emit","addListener","on","once","removeListener","removeAllListeners","listeners"];