/*!
 * webjs - Compiler
 * Copyright(c) 2012 C61 Lab
 * MIT Licensed
 */

var dataStream = require('dataStream');
var path = require('path');

module.exports = function (opt) {
  return function (req, res, next) {
    if (opt.enable.indexOf(path.extname(req.url).substr(1)) !== -1) {
      // header fields
      res.on('header', function () {
        res.removeHeader('Content-Length');
        res.setHeader('Content-Type', 'text/css');
      });

      // pipelining
      res.on('pipelining', function () {
        // fetch the render
        var engine = require(path.extname(req.url).substr(1));
        var render = engine.render || engine.compile;

        // create the stream
        var stream = new dataStream({ readable: false });

        // fetch the static root
        var root = global.web.set('static root');

        // listening
        stream.on('complete', function () {
          // file body
          var body = stream.body().toString();

          // empty the stream
          stream.empty();

          // rende it
          render(body, { paths: [root, root + '/css'] }, function (err, css) {
            if (err) return stream.emit('data', body);
            stream.emit('data', css);
          });

        });

        // return the stream to pipeling
        return stream;
      });
    }
    next();
  };
};