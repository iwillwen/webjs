var fs = require("fs");
var url = require("url");
var mimes = require('./mimes').mimes;
var util = require('util');
var utils = require('./utils');
var async = process.nextTick;
var httpStatus = require('./httpstatus').status;
var pathmo = require('path');
var http = require('http');
var expires = {
    maxAge: 60*60*24*365
};
var filesBuffers = {};
function sendfile (_fileName, res, req) {
    if (/^\//.test(_fileName)) _fileName = _fileName.substr(1);
    if (filesBuffers[_fileName] == undefined) {
        fs.stat(_fileName, function (err, stats) {
            if (err) return res.sendError(404);
            var acceptEncoding = req.headers['accept-encoding'] || "";
            var size = stats.size;
            var format = pathmo.extname(_fileName);
            var fileStream = fs.createReadStream(_fileName);
            var lastModified = stats.mtime.toUTCString();
            format = format ? format.slice(1) : 'unknown';
            var charset = mimes[format] || "text/plain";
            var expires1 = new Date();
            expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
            res.header("Expires", expires1.toUTCString());
            res.header("Cache-Control", "max-age=" + expires.maxAge);
            if (req.headers['If-Modified-Since'] && lastModified == request.headers['If-Modified-Since']) return this.sendError(304);
            res.header('Content-Type' , charset);
            res.header('Last-Modified', lastModified);
            res.header('Content-Length', size);
            filesBuffers[_fileName] = new Buffer(size);
            filesBuffers[_fileName].lastModified = lastModified;
            filesBuffers[_fileName].size = size;
            filesBuffers[_fileName].charset = charset;
            res.status(200);
            fileStream.on('data', function (chunk) {
                res.write(chunk);
                filesBuffers[_fileName].write(chunk.toString('utf8'));
            }).on('end', function () {
                res.end();
            });
        });
    } else {
        res.header('Content-Type' , filesBuffers[_fileName].charset);
        res.header('Last-Modified', filesBuffers[_fileName].lastModified);
        res.header('Content-Length', filesBuffers[_fileName].size);
        res.status(200);
        res.end(filesBuffers[_fileName]);
    }
}
//res
/*
 * @description Send a data to client. 发送数据到客户端 
 * @param {String} data Data to send(require) 发送的数据* 
 */
http.ServerResponse.prototype.long = function () {
    http.ServerResponse.prototype.send = function (data) {
        this.status(200);
        this.write(data);
    };
    return this;
};
http.ServerResponse.prototype.status = function(code){
    this.statusCode = code;
    return this;
};
http.ServerResponse.prototype.cache = function(type, options){
    var val = type;
    options = options || {};
    if (options.maxAge) val += ', max-age=' + (options.maxAge / 1000); 
    return this.set('Cache-Control', val);
};
http.ServerResponse.prototype.attachment = function(filename){
    var req = this.req;
    if (filename) this.type(filename);
    this.header('Content-Disposition', filename
        ? 'attachment; filename="' + basename(filename) + '"'
        : 'attachment');
    return this;
};
http.ServerResponse.prototype.download = http.ServerResponse.prototype.attachment;
http.ServerResponse.prototype.send = function (data) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Sending response, on ' + req.reqPath);
    this.status(200);
    this.end(data);
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] End send response, on ' + req.reqPath);
    return this;
};
http.ServerResponse.prototype.sendError = function (statu) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.err(' [' + req.method + '] Sending ' + statu + ' error, on ' + req.reqPath);
    var data = web.ErrorPage[statu] ? web.ErrorPage[statu] : httpStatus[String(statu)];
    this.statusCode = statu;
    this.header('Content-Type', "text/html");
    this.end(data);
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] End send ' + statu + ' error, on ' + req.reqPath);
    return this;
};
/*
 * @description Send a file to client. 发送指定文件到客户端
 * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
 */
http.ServerResponse.prototype.sendFile = function (fileName) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Sending file ' + req.reqPath);
    var req = this.req
    var _server = typeof server == 'object' ? server : web.server;
    var _server = _server ? _server : web.httpsServer;
    if ('/' in _server.handlers) {
        if (new RegExp(_server.handlers.url['/'], 'i').test(fileName)) {
            return async(function () {
                sendfile(fileName, this, req);
            });
        } else if (/\/$/i.test(_server.handlers.url['/']) && !/^\//i.test(fileName)) {
            return async(function () {
                sendfile(_server.handlers.url['/'] + fileName, this, req);
            });
        } else {
            return async(function () {
                sendfile(_server.handlers.url['/'] + '/' + fileName, this, req);
            });
        }
    }
    sendfile(fileName, this, req);
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] End send file ' + req.reqPath);
    return this;
};
/*
 * @description Send a JSON String to client. 发送JSON数据到客户端
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
http.ServerResponse.prototype.sendJSON = function (data) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Sending JSON, on ' + req.reqPath);
    switch (typeof data) {
        case "string":
            var charset = "application/json";
            this.statusCode = 200;
            this.header('Content-Type', charset);
            this.write(data);
            this.end();
            break;
        case "array":
        case "object":
            var sJSON = JSON.stringify(data),
                charset = "application/json";
            this.statusCode = 200;
            this.header('Content-Type', charset);
            this.write(sJSON);
            this.end();
            break;
    }
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] End send JSON, on ' + req.reqPath);
    return this;
};
/*
 * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
 * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
 */
http.ServerResponse.prototype.sendJSONP = function (data) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Sending JSONP, on ' + req.reqPath + ', callback function name: ' + req.qs.callback);
    var req = this.req
    switch (typeof data) {
        case "string":
            this.charset = "application/json";
            this.statusCode = 200;
            this.header('Content-Type', charset);
            this.write(req.qs.callback + '(' + data + ')');
            this.end();
            break;
        case "array":
        case "object":
            var sJSON = JSON.stringify(data);
            this.charset = "application/json";
            this.statusCode = 200;
            this.header('Content-Type', charset);
            this.write(req.qs.callback + '(' + sJSON + ')');
            this.end();
            break;
    }
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] End send JSON, on ' + req.reqPath + ', callback function name: ' + req.qs.callback);
    return this;
};
/*
 * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
 * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
 */
http.ServerResponse.prototype.redirect = function (url) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Redirect request, from ' + req.reqPath + ', to ' + url);
    var req = this.req
    switch (url) {
        /*
         * Redirect to home.
         */
        case 'home':
            this.status(302);
            this.header('Location', url.parse(req.url).hostname);
            this.end();
            console.log('Redirected to home');
            break;
        /*
         * Back to the previous page.
         */
        case 'back':
            this.status(302);
            this.header('Location', 'javascript:history.go(-1)');
            this.end();
            console.log('Redirected to back');
            break;
        /*
         * Refresh the client.
         */
        case 'refresh':
            this.status(302);
            this.header('Location', req.url);
            this.end();
            console.log('Refresh the client');
            break;
        /*
         * Redirected to specify url.
         */
        default:
            this.status(302);
            this.header('Location', url);
            this.end();
            console.log('Refresh to ' + url);
    }
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Emd redirect request, from ' + req.reqPath + ', to ' + url);
    return this;
};
/*
 * @description Set a cookies on the client. 在客户端设置cookies
 * @param {String} name name of the cookies.(require) cookies的名字*
 * @param {String} val content of the cookies.(require) cookies的数据*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
http.ServerResponse.prototype.setCookie = function (name, val, options) {
    var web = this.web;
    var req = this.req;
    if (typeof options != 'object')
        options = {};
    if (typeof options.path != 'string')
        options.path = '/';
    if (!(options.expires instanceof Date))
        options.expires = new Date();
    if (isNaN(options.maxAge))
        options.maxAge = 0;
    options.expithis.setTime(options.expithis.getTime() + options.maxAge * 1000);
    var cookie = utils.serializeCookie(name, val, options);
    var oldcookie = this.getHeader('Set-Cookie');
    if (typeof oldcookie != 'undefined')
        cookie = oldcookie + '\r\nSet-Cookie: ' + cookie;
    this.header('Set-Cookie', cookie);
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Set cookie, on ' + req.reqPath);
    return this;
};
http.ServerResponse.prototype.cookie = function (name, val, options) {
    var req = this.req;
    if (val) {
        return this.setCookie(name, val, options);
    } else {
        return this.cookies[name];
    }
};
/*
 * @decription Claer the specify cookies. 清除某指定cookies
 * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
 * @param {Object} options Detail options of the cookies. cookies的详细设置
 */
http.ServerResponse.prototype.clearCookie = function (name, options) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Claer header ' + name + ', on ' + req.reqPath);
    this.cookie(name, '', options);
    return this;
};
http.ServerResponse.prototype.header = function (header, value) {
    var web = this.web;
    var req = this.req;
    if (web.set('mode') == 'dev' || web.set('mode') == 'development') req.log.info(' [' + req.method + '] Set header ' + header + ': ' + value + ', on ' + req.reqPath);
    if (value && !this._headerSent) {
        this.setHeader(header, value);
        return this;
    } else {
        return this.req.headers[header];
    }
};