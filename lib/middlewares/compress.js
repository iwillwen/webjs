
/*!
 * Connect - compress
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2012 Will Wen Gunn
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var zlib = require('zlib');
var ext = require('path').extname;
var mime = require('mime');

/**
 * Supported content-encoding methods.
 */

exports.methods = {
  gzip: zlib.createGzip,
  deflate: zlib.createDeflate
};

/**
 * Default filter function.
 */

exports.filter = function(req, res) {
  var url = req.url;
  var extname = res.extname;

  // index.html support
  if ('/' == url[url.length - 1]) url += 'index.html';

  // res.send support
  if (res.text) url += 'index.html';

  // Lookup the file mime type
  var type = mime.lookup(ext(url)) || mime.lookup(extname);
  type = type || '';

  return type.match(/json|text|javascript|less|scss|sass|coffeescript/);
};

/**
 * Compress:
 *
 * Compress response data with gzip/deflate.
 *
 * Filter:
 *
 *  A `filter` callback function may be passed to
 *  replace the default logic of:
 *
 *     exports.filter = function(req, res){
 *       var type = res.getHeader('Content-Type') || '';
 *       return type.match(/json|text|javascript/);
 *     };
 *
 * Options:
 *
 *  All remaining options are passed to the gzip/deflate
 *  creation functions. Consult node's docs for additional details.
 *
 *   - `chunkSize` (default: 16*1024)
 *   - `windowBits`
 *   - `level`: 0-9 where 0 is no compression, and 9 is slow but best compression
 *   - `memLevel`: 1-9 low is slower but uses less memory, high is fast but uses more
 *   - `strategy`: compression strategy
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function compress(options) {
  var options = options || {};
  var names = Object.keys(exports.methods);
  var filter = options.filter || exports.filter;

  return function(req, res, next){
    var accept = req.headers['accept-encoding'];
    var write = res.write;
    var end = res.end;
    var stream;
    var method;

    // vary
    res.setHeader('Vary', 'Accept-Encoding');

    // default request filter
    if (!filter(req, res)) return next();

    // SHOULD use identity
    if (!accept) return next();

    // head
    if ('HEAD' == req.method) return next();

    // default to gzip
    if ('*' == accept.trim()) method = 'gzip';

    // compression method
    if (!method) {
      for (var i = 0, len = names.length; i < len; ++i) {
        if (~accept.indexOf(names[i])) {
          method = names[i];
          break;
        }
      }
    }

    // compression method
    if (!method) return next();

    // compression stream
    stream = exports.methods[method](options);

    // header fields
    res.on('header', function () {
      res.setHeader('Content-Encoding', method);
      res.removeHeader('Content-Length');
    });
    res.on('pipelining', function () {
      return stream;
    });

    next();
  };
}
