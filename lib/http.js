/*
 * @class HTTP exports
 */
var http = require('http');
var fs = require('fs');
var util = require('util');
var eventproxy = require('eventproxy').EventProxy;
var router = require('./router');
var mimes = require('./mimes').mimes;
var utils = require('./utils');
var asynclist = require('asynclist');
var httpStatus = require('./httpstatus');
var method = require('./method');
/*
 * @function Create a HTTP Server
 */
require('./response');
require('./request');
exports.createHttpServer = function () {
    var currentServer = exports.currentServer = http.createServer(function (req, res) {
        req.pipe(req.dataStream);
        req.dataStream.headers = req.headers;
        exports.req = req;
        exports.res = res;
        res.reqHeaders = req.headers;
        var tasks = events('route', req, res, global.web, currentServer);
        tasks.assign(route).run(req, res, function () {
            if (util.isError(arguments[0])) return res.render('error/error', {
                title: arguments[0].message,
                root: __dirname,
                layout: false,
                local: {
                    title: arguments[0].message,
                    message: arguments[0].message,
                    stack: arguments[0].stack
                }
            });
            tasks.trigger(true);
        });
    });
    method.ext(currentServer);
    currentServer.use = function (event, handle) {
        if (handle) {
            return this.on(event, handle);
        } else {
            return this.on('route', event);
        }
    };
    currentServer.httpMethodHelper = function (method, handlers, server) {
        var _server = typeof server == 'object' ? server : global.web.server;
        _server = _server ? _server : global.web.httpsServer;
        _server = _server ? _server : this;
        switch (typeof handlers) {
            case 'object':
                for(var key in handlers) {
                    if (this.handlers[method] === undefined && this.handlers[method] === undefined) {
                        this.handlers[method] = {};
                        this.rules[method] = {};
                    }
                    this.handlers[method][key] = handlers[key];
                    this.rules[method][key] = new RegExp('^' + key.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
                }
                break;
            case 'string':
                if (this.handlers[method] === undefined && this.handlers[method] === undefined) {
                    this.handlers[method] = {};
                    this.rules[method] = {};
                }
                this.handlers[method][handlers] = server;
                this.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
        }
        return this;
    };
    currentServer.handlers = {};
    currentServer.rules = {};
    return currentServer;
};
function events (event, req, res, web, server) {
    var handlers = global.web.listeners(event),
        _handlers = server.listeners(event);
    for (var i = 0;i < _handlers.length;i++) handlers.push(_handlers[i]);
    var tasks = new asynclist(handlers);
    return tasks;
}
function post () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    for (var key in currentServer.handlers.post)
        if (currentServer.rules.post[key].test(req.reqPath))
            router.handler('post', req, res, key, req.reqPath, currentServer);
}
function put () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    for (var key in currentServer.handlers.put)
        if (currentServer.rules.put[key].test(req.reqPath))
            router.handler('put', req, res, key, req.reqPath, currentServer);
}
function get () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    var hittedHandlers = [];
    for (var key in currentServer.handlers.get)
        if (currentServer.rules.get[key].test(req.reqPath)) {
            req.params = utils.restParser(key, currentServer.rules.get[key], req.reqPath);
            return currentServer.handlers.get[key](req, res, function () {
                if (util.isError(arguments[0])) return res.render('error/error', {
                    title: arguments[0].message,
                    root: __dirname,
                    layout: false,
                    local: {
                        title: arguments[0].message,
                        message: arguments[0].message,
                        stack: arguments[0].stack
                    }
                });
                router.urlHandler(req, res, key, req.reqPath, currentServer, global.web);
            });
        }
    for (var key in currentServer.handlers.url)
        if (currentServer.rules.url[key].test(req.reqPath))
            return router.urlHandler(req, res, key, req.reqPath, currentServer, global.web);
    fs.stat(req.reqPath.substr(1), function (err, stat) {
        if (err) return res.sendError(404);
        if (stat.isFile()) {
            router.fileHandler(req, res, req.reqPath, currentServer, global.web);
        } else {
            if (/\/$/i.test(req.reqPath)) {
                fs.stat(req.reqPath.substr(1) + 'index.html', function (err, stat) {
                    if (err) return res.sendError(404);
                    req.reqPath = req.reqPath + 'index.html';
                    router.fileHandler(req, res, req.reqPath, currentServer, global.web);
                });
            } else {
                fs.stat(req.reqPath.substr(1) + '/index.html', function (err, stat) {
                    if (err) return res.sendError(404);
                    req.reqPath = req.reqPath + '/index.html';
                    router.fileHandler(req, res, req.reqPath, currentServer, global.web);
                });
            }
        }
    });
}
function method (method) {
    return function () {
        if (global.web.config('readonly')) {
            return false;
        } else {
            var tasks = events(method, exports.req, exports.res, global.web, currentServer)
            tasks.assign(function () {
                router.handler(method, req, res, req.reqPath, currentServer);
            }).run();
        }
    }
}
function route () {
    var req = exports.req;
    var res = exports.res;
    var currentServer = exports.currentServer;
    switch (exports.req.method) {
        case "POST":
            var tasks = events('post', req, res, global.web, currentServer);
            tasks.assign(post).run(req, res, function () {
                if (util.isError(arguments[0])) return res.render('error/error', {
                    title: arguments[0].message,
                    root: __dirname,
                    layout: false,
                    local: {
                        title: arguments[0].message,
                        message: arguments[0].message,
                        stack: arguments[0].stack
                    }
                });
                tasks.trigger(true);
            });
            break;
        case "PUT":
            if (currentServer.config('readonly')) {
                return false;
            } else {
                var tasks = events('put', req, res, global.web, currentServer)
                tasks.assign(put).run(req, res, function () {
                    if (util.isError(arguments[0])) return res.render('error/error', {
                        title: arguments[0].message,
                        root: __dirname,
                        layout: false,
                        local: {
                            title: arguments[0].message,
                            message: arguments[0].message,
                            stack: arguments[0].stack
                        }
                    });
                    tasks.trigger(true);
                });
            }
            break;
        case "GET":
            var tasks = events('get', req, res, global.web, currentServer);
            tasks.assign(get).run(req, res, function () {
                if (util.isError(arguments[0])) return res.render('error/error', {
                    title: arguments[0].message,
                    root: __dirname,
                    layout: false,
                    local: {
                        title: arguments[0].message,
                        message: arguments[0].message,
                        stack: arguments[0].stack
                    }
                });
                tasks.trigger(true);
            });
            break;
        default:
            var tasks = events(exports.req.method, req, res, global.web, currentServer);
            tasks.assign(method(exports.req.method)).run(req, res, function () {
                if (util.isError(arguments[0])) return res.render('error/error', {
                    title: arguments[0].message,
                    root: __dirname,
                    layout: false,
                    local: {
                        title: arguments[0].message,
                        message: arguments[0].message,
                        stack: arguments[0].stack
                    }
                });
                tasks.trigger(true);
            });
    }
}