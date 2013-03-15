/*!
 * webjs - Response Patch
 * Copyright(c) 2012 C61 Lab
 * MIT Licensed
 */

// dependencies
var fs = require("fs");
var url = require("url");
var mime = require('mime');
var util = require('util');
var utils = require('./utils');
var dataStream = require('dataStream');
var eventproxy = require('eventproxy').EventProxy;
var http = require('http');

// deafult cookie config
var expires = {
  maxAge: 60 * 60 * 24 * 365
};

exports = module.exports = Response;

function Response(res, req) {

  // reset the navite response object with a dataStream object
  var source = new dataStream();

  // force merge
  utils.merge(this, source);

  // let the new response object can be use as a navite response object
  this.statusCode = res.statusCode;
  this.self = res;
  this.callback = (req.query ? req.query.callback : null);
  this.getHeader = function() {res.getHeader.apply(res, arguments);};
  this.setHeader = function() {res.setHeader.apply(res, arguments);};
  this.removeHeader = function() {res.removeHeader.apply(res, arguments);};
  this.addTrailers = function() {res.addTrailers.apply(res, arguments);};
  this.req = function() {
    return req;
  };
  for (var key in res) if (navites.indexOf(key) === -1) this[key] = res[key];

}

util.inherits(Response, dataStream);

// Response prototype


/**
 * Basic Data Send Method
 * @required @param  {String} data     The data need to send.
 * @param  {String} _charset The data's Content-Type
 * @return {Object} response    Response Object
 *
 * res.send('Some String');
 *
 * res.send([
 *     'body {',
 *     '    font-family: Monaco, sans-serif;',
 *     '    font-size: 0.7em;',
 *     '}'
 * ].join('/r/n'),
 * 'text/css');
 *
 * You only call the method once in a router handler if you have not call the long method.
 * 
 */
Response.prototype.send = function(data, _charset) {

  // response object
  var self = this;
  var res = self.self;

  // emit 'send' event
  this.emit('send');

  this.text = true;

  // set the response complete
  this.statusCode = 200;

  // set the content type with UTF-8 encoded.
  var charset = _charset || 'text/html; charset=utf-8';

  // headers
  this.header('Content-Type', charset);
  this.header('X-Server', 'webjs');

  // if the data param is not undefined, push it to the dataStream
  if (data) self.write(data);

  // fetch the response pipelining streams
  var pipes = this.listeners('pipelining');
  var _pipes = this.self.listeners('pipelining');
  [].push.apply(pipes, _pipes);

  // begin setting the stream pipelining
  var last = this;
  pipes.push(function() {
    return res;
  });
  for (var i = 0; i < pipes.length; i++) {
    var newone = pipes[i]();
    if (newone) {
      last.pipe(newone);
      last = newone;
    }
  }

  // if there is not any stream to control the response, let the response send when the data finish writing
  if (data) this.ok().end();

  return this;
};


/**
 * set send method into long sending
 * @return {Object} response    response object
 *
 * res.long()
 *     .send('')
 * 
 */
Response.prototype.long = function() {

  // response object
  var self = this;
  var res = self.self;

  // emit 'send' event
  this.emit('long');

  // fetch the response pipelining streams
  var pipes = this.listeners('pipelining');
  var _pipes = this.self.listeners('pipelining');
  [].push.apply(pipes, _pipes);

  // begin setting the stream pipelining
  var last = this;
  pipes.push(function() {
    return res;
  });
  for (var i = 0; i < pipes.length; i++) {
    var newone = pipes[i]();
    if (newone) {
      last.pipe(newone);
      last = newone;
    }
  }

  // set the response complete
  this.statusCode = 200;
  // headers
  this.header('X-Server', 'webjs');

  // reset the send method
  this.send = function(data) {
    this.write(data);
    return this;
  };
  this._end = this.end;
  this.end = function(charset) {
    // set the content type with UTF-8 encoded.
    charset = charset || 'text/html; charset=utf-8';
    this.header('Content-Type', charset);

    return this._end();
  }
  return this;
};

/**
 * set the response status
 * @param  {Number} code The HTTP response status
 * @return {Object} response     response object
 *
 * res.status(200)
 *     .send('Hello World.');
 *
 * res.statu(404)
 *     .('Sorry! The page not found!');
 * 
 */
Response.prototype.status = function(code) {

  // emit the status event
  this.emit('status');

  // set the response status
  this.statusCode = code;

  return this;
};

/**
 * set the browser cache
 * @param  {String} type    cache type
 * @param  {Object} options cache option
 * @return {Object} response        response object
 *
 * // set one day cache
 * res.cache('privte', { maxAge: 86400000 });
 *
 * // clean the cache
 * res.cache('no-cache');
 * 
 */
Response.prototype.cache = function(type, options) {

  // emit the cache event
  this.emit('cache');

  // copy the cache type
  var val = type;

  // get the option
  options = options || {};

  // if you set the maxAge param, it will be put into the header
  if (options.maxAge) val += ', max-age=' + (options.maxAge / 1000);

  // set the header
  return this.header('Cache-Control', val);
};
Response.prototype.attachment = function(filename){
  this.emit('attachment');
  if (filename) this.type(filename);
  this.header('Content-Disposition', filename
    ? 'attachment; filename="' + basename(filename) + '"'
    : 'attachment');
  return this;
};
Response.prototype.download = Response.prototype.attachment;

/**
 * Template render
 * @param {String} templateName Template's name
 * @param {Object} view The rende object
 * @return {Object} response response object
 *
 * web.config({
 *         'views': __dirname + '/views',
 *         'view engine': 'ejs',
 *         'ejs': 'html'
 *     })
 *     .get('/foo', function(req, res) {
 *         res.render('test', {
 *             title: 'Test Template Render',
 *             local: {
 *                 foo: 'bar'
 *             }
 *         });
 *     });
 * 
 */
Response.prototype.render = function() {

  // copy the response object
  var self = this;

  // fetch the params
  var name = arguments[0];
  var view = arguments[1];
  var opt = arguments[arguments.length - 1];

  // deafult layout view object
  var layout_view = {
    title: 'webjs starting',
    root: global.web.set('views')
  };

  // fetch the view engine
  var ext = global.web.set('view engine') || 'jade';
  var engine = require(ext);

  // emit the render event
  this.emit('render', name, view);

  // fetch the template file extname
  ext = global.web.set(ext) || ext;

  // template files directory
  var root = layout_view.root;

  // async eventproxy object
  var render = new eventproxy();

  // render method
  var Render = engine.render;

  if (!/\/$/i.test(root)) root += '/';

  // deal with the view object
  var _view = view;
  var dynamicView = this.dynamicView;
  for (var key in dynamicView) {
    view[key] = dynamicView[key];
    if (view.local) {
      layout_view[key] = dynamicView[key];
      view.local[key] = dynamicView[key];
    }
  }
  for (var key in _view) {
    view[key] = _view[key];
  }
  if (view.local) {
    layout_view = view;
    if (view.engine) ext = view.engine;
    if (view.root) layout_view.root = view.root;
    view = view.local;
    view.filename = root + name + '.' + ext;
    layout_view.filename = root + 'layout.' + ext;
  }


  // set up async assgin
  render.assign('layout', 'body', function(layout, body) {

    // view object
    layout_view.body = body;
    if (layout) {
      var fin = Render(layout, layout_view, function(err, fin) {

        // fallback
        if (err) return self.sendError(500);

        // pipe
        self.extname = 'html';
        self.send(fin);
      });
      if (fin) {
        self.extname = 'html';
        self.send(fin);
      }
    } else {
      // pipe
      self.extname = 'html';
      self.send(body);
    }
  });

  // deal with the layout
  if (opt.layout !== false) {
    if (opt.layout === undefined || opt.layout === true) {
      fs.readFile(root + 'layout.' + ext, function(err, layout) {
        if (err) return render.trigger('layout', '!= body');
        render.trigger('layout', layout.toString());
      });
    } else {
      fs.readFile(root + opt.layout + '.' + ext, function(err, layout) {
        if (err) return render.trigger('layout', '!= body');
        render.trigger('layout', layout.toString());
      });
    }
  } else {
    render.trigger('layout', false);
  }
  fs.readFile(root + name + '.' + ext, function(err, tmlp) {
    // fallback
    if (err) return self.sendError(500);

    // rende
    var body = Render(tmlp.toString(), view, function(err, body) {

      // fallback
      if (err) return self.sendError(500);
      render.trigger('body', body);
    });
    if (body) render.trigger('body', body);
  });
  return this;
};

/**
 * send a error to the client
 * @required @param {Number} statu HTTP status
 * @return {Object} response response object
 *
 * res.sendError(404);
 * 
 */
Response.prototype.sendError = function() {

  var args = Array.prototype.slice.call(arguments);

  var statu = args[0];
  var argv = args.slice(1);

  if (util.isError(statu)) {
    this.self.statusCode = 503;
    this.header('Content-Type', 'text/html');
    return this.self.end('Error: ' + statu.message);
  }

  // emit http_error event
  this.emit('http_error', statu);

  var errHandler = (function() {
    if ('undefined' !== typeof global.web.server.handlers.error) {
      if ('undefined' !== typeof global.web.server.handlers.error[statu]) {
        return global.web.server.handlers.error[statu];
      } else {
        return null;
      }
    } else {
      return null;
    }
  })();
  
  if (errHandler) {
    var req = this.req();
    if (argv.length < 1) {
      errHandler(req, this, function() {
        // fetch the error data
        var data = global.web.ErrorPage[statu] ? global.web.ErrorPage[statu] : http.STATUS_CODES[statu.toString()];

        this.self.statusCode = statu;
        this.header('Content-Type', 'text/html');
        this.self.end(data);
      });
    } else {
      errHandler(argv[0], req, this, function() {
        // fetch the error data
        var data = global.web.ErrorPage[statu] ? global.web.ErrorPage[statu] : http.STATUS_CODES[statu.toString()];

        this.self.statusCode = statu;
        this.header('Content-Type', 'text/html');
        this.self.end(data);
      });
    }
    return this;
  }

  // fetch the error data
  var data = (global.web.ErrorPage && global.web.ErrorPage[statu] ? global.web.ErrorPage[statu] : http.STATUS_CODES[statu.toString()]);

  this.statusCode = statu;
  this.header('Content-Type', 'text/html');
  this.self.end(data);

  return this;
};
/*
 * @description Send a file to client. 发送指定文件到客户端
 * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
 */
Response.prototype.sendFile = function(fileName, found, _charset) {
  this.emit('sendfile', fileName);
  if (!found) {
    var _server = typeof server == 'object' ? server : global.web.server;
    var _server = _server ? _server : global.web.httpsServer;
    if ('/' in _server.handlers) {
      if (new RegExp(_server.handlers.url['/'], 'i').test(fileName)) {
        return sendfile(fileName, this, false, _charset);
      } else if (/\/$/i.test(_server.handlers.url['/']) && !/^\//i.test(fileName)) {
        return sendfile(_server.handlers.url['/'] + fileName, this, false, _charset);
      } else {
        return sendfile(_server.handlers.url['/'] + '/' + fileName, this, false, _charset);
      }
    }
  } else {
    sendfile(fileName, this, true, _charset);
  }
  return this;
};
Response.prototype.sendfile = Response.prototype.sendFile;
/*
 * @description Send a JSON String to client. 发送JSON数据到客户端
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
Response.prototype.sendJSON = function(data) {
  this.emit('sendJSON', data);
  switch (typeof data) {
    case "string":
      this.send(data, 'application/json; charset=UTF-8');
      break;
    case "array":
    case "object":
      this.send(JSON.stringify(data), 'application/json; charset=UTF-8');
      break;
  }
  return this;
};
Response.prototype.json = Response.prototype.sendJSON;
/*
 * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
Response.prototype.sendJSONP = function(data) {
  this.emit('sendJSONP', data);
  var callback = this.callback;
  switch (typeof data) {
    case "string":
      this.send(callback + '(' + data + ')', 'application/json');
      break;
    case "array":
    case "object":
      this.send(callback + '(' + JSON.stringify(data) + ')', 'application/json');
      break;
  }
  return this;
};
Response.prototype.jsonp = Response.prototype.sendJSONP;
/*
 * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
 * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
 */
Response.prototype.redirect = function(_url) {

  if (_url.indexOf('://') == -1) {
    var root = this.req().headers.referer;
    _url = url.resolve(root, _url);
  }

  this.emit('redirect', _url);
  this.self.statusCode = 302;
  this.header('Location', _url);
  this.header('X-Server', 'webjs');
  this.self.end();
  return this;
};
/*
 * @description Set a cookies on the client. 在客户端设置cookies
 * @param {String} name name of the cookies.(require) cookies的名字*
 * @param {String} val content of the cookies.(require) cookies的数据*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
Response.prototype.setCookie = function(name, val, options) {
  this.emit('setCookie', name, val);
  if (typeof options != 'object')
    options = {};
  if (typeof options.path != 'string')
    options.path = '/';
  if (!(options.expires instanceof Date))
    options.expires = new Date();
  if (isNaN(options.maxAge))
    options.maxAge = 0;
  options.expires.setTime(options.expires.getTime() + options.maxAge * 1000);
  var cookie = utils.serializeCookie(name, val, options);
  var oldcookie = this.getHeader('Set-Cookie');
  if (typeof oldcookie != 'undefined')
    cookie = oldcookie + '\r\nSet-Cookie: ' + cookie;
  this.header('Set-Cookie', cookie);
  return this;
};
Response.prototype.cookie = Response.prototype.setCookie;
/*
 * @decription Claer the specify cookies. 清除某指定cookies
 * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
Response.prototype.clearCookie = function(name, options) {
  this.cookie(name, '', options);
  return this;
};
Response.prototype.header = function(header, value) {
  this.emit('header', header, value);
  if (value && !this.self._headerSent) this.self.setHeader(header, value);
  if (value === false && !this.self._headerSent) return this.self.removeHeader(header);
  if (!value) return this.self.getHeader(header);
  return this;
};




function sendfile (_fileName, res, found, _charset) {
  if (!found) if (/^\//.test(_fileName)) _fileName = _fileName.substr(1);
  fs.stat(_fileName, function(err, stats) {
    if (err) return res.sendError(404);
    var size = stats.size;
    var format = require('path').extname(_fileName);
    var lastModified = stats.mtime.toUTCString();
    res.last = lastModified;
    format = format ? format.slice(1) : 'unknown';
    res.format = format;
    var charset = mime.lookup(format) || 'text/plain; charset=UTF-8';
    if (_charset) charset = _charset;
    var expires1 = new Date();
    if (res.reqHeaders['range']) {
      var range = utils.parseRange(res.reqHeaders['range'], size);
      if (range) {
        res.header('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + stats.size);
        res.header('Content-Length', (range.end - range.start + 1));
        var fileStream = fs.createReadStream(_fileName, range);
        res.statusCode = 206;
      } else {
        res.statusCode = 200;
        res.header('Content-Length', size);
        var fileStream = fs.createReadStream(_fileName);
      }
    } else {
      res.statusCode = 200;
      res.header('Content-Length', size);
      var fileStream = fs.createReadStream(_fileName);
    }
    expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
    res.header("Expires", expires1.toUTCString());
    res.header("Cache-Control", "max-age=" + expires.maxAge);
    res.header('Content-Type' , charset);
    res.header('Last-Modified', lastModified);
    fileStream.pipe(res);
    res.send(false, charset);
  });
}

var navites = ["buffer", "output","outputEncodings","writable","_last","chunkedEncoding","shouldKeepAlive","useChunkedEncodingByDefault","sendDate","_hasBody","_trailer","finished","socket","connection","_events","statusCode","assignSocket","detachSocket","writeContinue","_implicitHeader","writeHead","writeHeader","headerSent","setHeader","_renderHeaders","_hasConnectPatch","destroy","_send","_writeRaw","_buffer","_storeHeader","getHeader","removeHeader","write","addTrailers","end","_finish","_flush","pipe","setMaxListeners","emit","addListener","on","once","removeListener","removeAllListeners","listeners"];