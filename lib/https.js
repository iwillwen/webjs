/*
 * @class HTTPS module
 */
var https = require("https");
var fs = require("fs");
var urlmo = require("url");
var util = require('util');
var formidable = require('formidable');
var eventproxy = require('eventproxy').EventProxy;
var router = require('./router');
var mimes = require('./mimes').mimes;
var utils = require('./utils');
var asynclist = require('asynclist');
var httpsStatus = require('./httpstatus');
var method = require('./method');
var async = process.nextTick;
/*
 * @function Create a HTTPS Server
 */
var getProxy = new eventproxy();
function responser (req, res, url, handler, file, web, server) {
    if (handler) {
        req.qs = urlmo.parse(req.url, true).query;
        handler(req, res, function () {
            router.urlHandler(req, res, url, req.reqPath, server, web);
        });
    } else if (url) {
        router.urlHandler(req, res, url, req.reqPath, server, web);
    } else if (file) {
        router.fileHandler(req, res, req.reqPath, server, web);
    } else {
        res.sendError(404);
    }
}
function events (event, req, res, web, server) {
    var handlers = web.listeners(event),
        _handlers = server.listeners(event);
    for (var i = 0;i < _handlers.length;i++) handlers.push(_handlers[i]);
    var list = handlers.map(function (handler) {
            return function () {
                handler(req, res, function () {
                    tasks.trigger(true);
                });
            }
        });
    var tasks = new asynclist(list);
    return tasks;
}
exports.createHttpsServer = function (web, options) {
    require('./response');
    require('./request');
    var currentServer = https.createServer(options, function (req, res) {
        getProxy.assign("req", "res", "url", "handler", "file", "web", "server", responser);
        var path = urlmo.parse(req.url).pathname;
        req.reqPath = path;
        res.req = req;
        req.log.web = web;
        req.web = web;
        res.web = web;
        getProxy.trigger('res', res);
        getProxy.trigger('req', req);
        getProxy.trigger('web', web);
        getProxy.trigger('server', currentServer);
        res.header('Date', new Date().toUTCString());
        res.header('Server', 'Node.js with webjs');
        res.header('Accept-Ranges', 'bytes');
        // 解析Cookies
        if (web.set('cookiesParse'))
            req.cookies = utils.unserializeCookie(req.headers.cookie) || {};
        if (web.set('sessionParse'))
            req.sessionStart();
        var tasks = events('route', req, res, web, currentServer);
        tasks.assign(function () {
            switch (req.method) {
                case "POST":
                    var tasks = events('route', req, res, web, currentServer);
                    tasks.assign(function () {
                        if (!web.set('bodyParse')) {
                            if (web.set('bodyParse')) {
                                var form1 = new formidable.IncomingForm();
                                form1.parse(req, function (err, fields, files) {
                                    req.data = fields;
                                    var j = 0,
                                        y = 0;
                                    for (var key in files) {
                                        y++;
                                        if (files[key].path) {
                                            fs.readFile(files[key].path, function (err, data) {
                                                i++;
                                                if (!err) req.data[key] = data;
                                                if (i == y)
                                                    process.nextTick(function () {
                                                        router.handler('post', req, res, path, currentServer);
                                                    });
                                            });
                                        }
                                    }
                                });
                            } else {
                                process.nextTick(function () {
                                    router.handler('post', req, res, path, currentServer);
                                });
                            }
                        } else {
                            process.nextTick(function () {
                                router.handler('post', req, res, path, currentServer);
                            });
                        }
                    }).run();
                    break;
                case "PUT":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        var tasks = events('put', req, res, web, currentServer)
                        tasks.assign(function () {
                            if (!web.set('bodyParse')) {
                                if (web.set('bodyParse')) {
                                    var form1 = new formidable.IncomingForm();
                                    form1.parse(req, function (err, fields, files) {
                                        req.data = fields;
                                        var j = 0,
                                            y = 0;
                                        for (var key in files) {
                                            y++;
                                            if (files[key].path) {
                                                fs.readFile(files[key].path, function (err, data) {
                                                    i++;
                                                    if (!err) req.data[key] = data;
                                                    if (i == y)
                                                        process.nextTick(function () {
                                                            router.handler('put', req, res, path, currentServer);
                                                        });
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    process.nextTick(function () {
                                        router.handler('put', req, res, path, currentServer);
                                    });
                                }
                            } else {
                                process.nextTick(function () {
                                    router.handler('put', req, res, path, currentServer);
                                });
                            }
                        }).run();
                    }
                    break;
                case "GET":
                    async(function () {
                        for (var key in currentServer.handlers.get)
                            if (currentServer.rules.get[key].test(path))
                                return getProxy.trigger('handler', currentServer.handlers.get[key]);
                        getProxy.trigger('handler', false);
                    });
                    async(function () {
                        for (var key in currentServer.handlers.url)
                            if (currentServer.rules.url[key].test(path))
                                return getProxy.trigger('url', key);
                        getProxy.trigger('url', false);
                    });
                    fs.stat(path.substr(1), function (err, stat) {
                        if (err) return getProxy.trigger('file', false);
                        if (stat.isFile()) {
                            getProxy.trigger('file', true)
                        } else {
                            if (/\/$/i.test(path)) {
                                fs.stat(path.substr(1) + 'index.html', function (err, stat) {
                                    if (err) return getProxy.trigger('file', false);
                                    path = path + 'index.html';
                                    req.reqPath = path;
                                    getProxy.trigger('file', true)
                                })
                            } else {
                                fs.stat(path.substr(1) + '/index.html', function (err, stat) {
                                    if (err) return getProxy.trigger('file', false);
                                    path = path + '/index.html';
                                    req.reqPath = path;
                                    getProxy.trigger('file', true)
                                });
                            }
                        }
                    });
                    break;
                case "DELETE":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        var tasks = events("delete", req, res, web, currentServer)
                        tasks.assign(function () {
                            router.handler('delete', req, res, path, currentServer);
                        }).run();
                    }
                    break;
                case "DEAD":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        var tasks = events("head", req, res, web, currentServer)
                        tasks.assign(function () {
                            router.handler('head', req, res, path, currentServer);
                        }).run();
                    }
                    break;
                case "TRACE":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        var tasks = events("trace", req, res, web, currentServer)
                        tasks.assign(function () {
                            res.sendJSON(req.headers);
                        }).run();
                    }
                    break;
            }
        }).run();
    });
    method.ext(currentServer);
    currentServer.use = function (event, handle) {
        if (handle) {
            return this.on(event, handle);
        } else {
            return this.on('route', event);
        }
    };
    currentServer.config = {};
    currentServer.httpsMethodHelper = function (method, handlers) {
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