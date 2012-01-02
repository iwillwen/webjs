/*
 * @class HTTP module
 */
var http = require("http"),
    fs = require("fs"),
    url = require("url"),
    formidable = require('formidable'),
    eventproxy = require('eventproxy').EventProxy,
    router = require('./router'),
    mimes = require('./mimes').mimes,
    utils = require('./utils'),
    httpStatus = require('./httpstatus'),
    method = require('./method'),
    async = process.nextTick;
/*
 * @function Create a HTTPs Server
 */
var getProxy = new eventproxy();
function responser (req, res, url, handler, file, web, server) {
    if (handler) {
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
exports.createHttpServer = function (web) {
    web.servers = [];
    var currentServer =  http.createServer(function (req, res) {
        getProxy.assign("req", "res", "url", "handler", "file", "web", "server", responser);
        var path = url.parse(req.url).pathname;
        req.reqPath = path;
        getProxy.trigger('web', web);
        getProxy.trigger('server', currentServer);
        async(function () {
            require('./response')(res, req, web, function () {
                getProxy.trigger('res', res);
            });
        })
        async(function () {
            require('./request')(req, res, function () {
                getProxy.trigger('req', req);
            });
        });
        /*
         * Use the formidable to parse the post request.
         */

        // 解析Cookies
        if (web.set('cookiesParse'))
            req.cookies = utils.unserializeCookie(req.headers.cookie) || {};
        if (web.set('sessionParse'))
            req.sessionStart();
        web.then('route', function () {
            switch (req.method) {
                case "POST":
                    web.then('post', function () {
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
                    }).emit('post');
                    break;
                case "PUT":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        web.then('put', function () {
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
                        }).emit('put');
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
                        stat.isFile()
                            ? getProxy.trigger('file', true)
                            : getProxy.trigger('file', false);
                    });
                    break;
                case "DELETE":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        web.then("delete", function () {
                            router.handler('delete', req, res, path, currentServer);
                        }).emit('delete');
                    }
                    break;
                case "DEAD":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        web.then("head", function () {
                            router.handler('head', req, res, path, currentServer);
                        }).emit('head');
                    }
                    break;
                case "TRACE":
                    if (currentServer.config('readonly')) {
                        return false;
                    } else {
                        web.then("trace", function () {
                            res.send(req.header);
                        }).emit('trace');
                    }
                    break;
            }
        }).emit('route');
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
    currentServer.httpMethodHelper = function (method, handlers) {
        switch (typeof handlers) {
            case 'object':
                for(var key in handlers) {
                    this.handlers[method][key] = handlers[key];
                    this.rules[method][key] = new RegExp('^' + key.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
                }
                break;
            case 'string':
                this.handlers[method][handlers] = server;
                this.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
        }
        return this;
    };
    currentServer.on = function (event, handler) {
        web.on(event, handler);
        return this;
    };
    currentServer.once = function (event, handler) {
        web.once(event, handler);
        return this;
    };
    currentServer.handlers = {
        get: {},
        post: {},
        put: {},
        delete: {},
        head: {},
        error: {},
        blockMimes: {},
        url: {}
    };
    currentServer.rules = {
        get: {},
        post: {},
        put: {},
        delete: {},
        head: {},
        url: {}
    };
    return currentServer;
};