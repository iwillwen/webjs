var fs = require("fs");
var url = require("url");
var mimes = require('./mimes').mimes;
var util = require('util');
var utils = require('./utils');
var dataStream = require('dataStream');
var async = process.nextTick;
var httpStatus = require('./httpstatus').status;
var eventproxy = require('eventproxy').EventProxy;
var pathmo = require('path');
var http = require('http');
var expires = {
    maxAge: 60*60*24*365
};
var filesBuffers = {};

exports = module.exports = Response;

function Response (res) {
    var source = new dataStream();
    utils.merge(this, source);
    this.__defineGetter__('statusCode', function () { return res.statusCode; });
    this.__defineGetter__('self', function () { return res; });
    this.getHeader = function () {res.getHeader.apply(res, arguments);};
    this.setHeader = function () {res.setHeader.apply(res, arguments);};
    this.removeHeader = function () {res.removeHeader.apply(res, arguments);};
    this.addTrailers = function () {res.addTrailers.apply(res, arguments);};
}

util.inherits(Response, dataStream);

function sendfile (_fileName, res, found, _charset) {
    if (!found) if (/^\//.test(_fileName)) _fileName = _fileName.substr(1);
    fs.stat(_fileName, function (err, stats) {
        if (err) return res.sendError(404);
        var size = stats.size;
        var format = pathmo.extname(_fileName);
        var lastModified = stats.mtime.toUTCString();
        res.last = lastModified;
        format = format ? format.slice(1) : 'unknown';
        res.format = format;
        var charset = mimes[format] || 'text/plain; charset=UTF-8';
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
//res
/*
 * @description Send a data to client. 发送数据到客户端 
 * @param {String} data Data to send(require) 发送的数据* 
 */
Response.prototype.long = function () {
    this.emit('long');
    Response.prototype.send = function (data, _charset) {
        var self = this;
        this.emit('send');
        this.statusCode = 200;
        var charset = _charset || 'text/html; charset=UTF-8';
        this.header('Content-Type', charset);
        this.header('X-Server', 'webjs');
        if (data) this.write(data);
        var pipes = this.listeners('beforeSend');
        var last = this;
        pipes.push(function () {
            return self.self;
        });
        for (var i = 0; i < pipes.length; i++) {
            var newone = pipes[i]();
            if (newone) {
                last.pipe(newone);
                last = newone;
            }
        }
    };
    return this;
};
Response.prototype.status = function (code) {
    this.emit('status');
    this.statusCode = code;
    return this;
};
Response.prototype.cache = function (type, options) {
    this.emit('cache');
    var val = type;
    options = options || {};
    if (options.maxAge) val += ', max-age=' + (options.maxAge / 1000);
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
Response.prototype.send = function (data, _charset) {
    var self = this;
    this.emit('send');
    this.statusCode = 200;
    var charset = _charset || 'text/html; charset=UTF-8';
    this.header('Content-Type', charset);
    this.header('X-Server', 'webjs');
    if (data) this.write(data);
    var pipes = this.listeners('beforeSend');
    var last = this;
    pipes.push(function () {
        return self.self;
    });
    for (var i = 0; i < pipes.length; i++) {
        var newone = pipes[i]();
        if (newone) {
            last.pipe(newone);
            last = newone;
        }
    }
    if (data) this.ok().end();
};
Response.prototype.pipelining = function (cb) {
    this.on('beforeSend', cb);
    return this;
};
Response.prototype.use = Response.prototype.pipelining;
Response.prototype.__defineGetter__('dataStream', function () {
    if (this._dataStream) {
        return this._dataStream;
    } else {
        var data = new dataStream();
        this._dataStream = data;
        return data;
    }
});
Response.prototype.render = function () {
    var self = this;
    var name = arguments[0];
    var view = arguments[arguments.length - 1];
    var layout_view = {
        title: 'webjs starting',
        root: global.web.set('views')
    };
    var ext = global.web.set('view engine') || 'jade';
    this.emit('render', name, view);
    var opt = (arguments.length > 2 ? arguments[1] : {});
    var engine = require(ext);
    var root = layout_view.root;
    var render = new eventproxy();
    if (!/\/$/i.test(root)) root += '/';
    if (view.local) {
        layout_view = view;
        if (view.engine) ext = view.engine;
        if (view.root) layout_view.root = view.root;
        view = view.local;
        view.filename = root + name + '.' + ext;
    }
    render.assign('layout', 'body', function (layout, body) {
        layout_view.body = body;
        engine.render(layout, layout_view, function (err, fin) {
            //if (err) return self.sendError(500);
            self.format = 'html';
            self.send(fin, 'text/html');
        });
    });
    if (opt.layout !== false) {
        if (opt.layout === undefined || opt.layout === true) {
            fs.readFile(root + 'layout.' + ext, function (err, layout) {
                if (err) return render.trigger('layout', '!= body');
                render.trigger('layout', layout.toString());
            });
        } else {
            fs.readFile(root + opt.layout + '.' + ext, function (err, layout) {
                if (err) return render.trigger('layout', '!= body');
                render.trigger('layout', layout.toString());
            });
        }
    } else {
        render.trigger('layout', '!= body');
    }
    fs.readFile(root + name + '.' + ext, function (err, tmlp) {
        if (err) return self.sendError(500);
        engine.render(tmlp.toString(), view, function (err, body) {
            if (err) return self.sendError(500);
            render.trigger('body', body);
        });
    });
};
Response.prototype.sendError = function (statu) {
    this.emit('http_error', statu);
    var data = global.web.ErrorPage[statu] ? global.web.ErrorPage[statu] : httpStatus[String(statu)];
    var c = global.server ? global.server : global.web;
    var self = this;
    self.statusCode = statu;
    self.header('Content-Type', 'text/html');
    self.end(data);
    return this;
};
/*
 * @description Send a file to client. 发送指定文件到客户端
 * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
 */
Response.prototype.sendFile = function (fileName, found, _charset) {
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
Response.prototype.sendJSON = function (data) {
    this.emit('sendJSON', data);
    switch (typeof data) {
        case "string":
            this.send(data, 'application/json');
            break;
        case "array":
        case "object":
            this.send(JSON.stringify(data), 'application/json');
            break;
    }
    return this;
};
Response.prototype.json = Response.prototype.sendJSON;
/*
 * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
Response.prototype.sendJSONP = function (data) {
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
Response.prototype.redirect = function (url) {
    this.emit('redirect', url);
    this.statusCode = 302;
    this.header('Location', url);
    this.end();
    return this;
};
/*
 * @description Set a cookies on the client. 在客户端设置cookies
 * @param {String} name name of the cookies.(require) cookies的名字*
 * @param {String} val content of the cookies.(require) cookies的数据*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
Response.prototype.setCookie = function (name, val, options) {
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
Response.prototype.clearCookie = function (name, options) {
    this.cookie(name, '', options);
    return this;
};
Response.prototype.header = function (header, value) {
    this.emit('header', header, value);
    if (value && !this._headerSent) this.setHeader(header, value);
    if (value === false && !this._headerSent) return this.removeHeader(header);
    if (!value) return this.getHeader(header);
    return this;
};