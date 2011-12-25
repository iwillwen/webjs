/*
 * @class HTTPS module
 */
var https = require("https"),
    fs = require("fs"),
    url = require("url"),
    formidable = require('formidable'),
    router = require('./router'),
    mimes = require('./mimes').mimes,
    utils = require('./utils'),
    httpStatus = require('./httpstatus'),
    asynclist = require('asynclist');
/*
 * @function Create a HTTPs Server
 */
exports.createHttpsServer = function () {
    global.web.httpsServers = [];
    exports.server = https.createServer(function (req, res) {
            this.configs = {};
            var path = url.parse(req.url).pathname.substring(1);
            // 解析Cookie
            require('./response')(res, req);
            require('./request')(req, res);
            /*
             * Use the formidable to parse the post request.
             */
            
            var executeEventAsync = function (eventName) {
                var handlers = global.web.listeners(eventName);
                function next () {
                    tasks.trigger('finished');
                }
                handlers = handlers.map(function (handler) {
                    return function () {
                        handler(req, res, next);
                    }
                })
                var tasks = new asynclist(handlers);
                return tasks;
            };
            if (global.web.set('cookiesParse'))
                req.cookies = utils.unserializeCookie(req.headers.cookie) || {};
            if (global.web.set('sessionParse'))
                req.sessionStart();
            var tasks = executeEventAsync("route");
            tasks.assign(function () {
                switch (req.method.toLowerCase()) {
                    case "post":
                        var tasks = executeEventAsync("post");
                        tasks.assign(function () {
                            if (!global.web.set('bodyParse')) {
                                if (global.web.set('bodyParse')) {
                                    var form = new formidable.IncomingForm();
                                    form.parse(req, function (err, fields, files) {
                                        req.data = fields;
                                        for (var key in files) {
                                            if (files[key].path)
                                                req.data[key] = fs.readFileSync(files[key].path).toString('utf8');
                                        }
                                        router.postHandler(req, res, path, exports.server);
                                    });
                                } else {
                                    router.postHandler(req, res, path, exports.server);
                                }
                            } else {
                                router.postHandler(req, res, path, exports.server);
                            }
                        });
                        tasks.run();
                        break;
                    case "put":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            var tasks = executeEventAsync("put");
                            tasks.assign(function () {
                                if (!global.web.set('bodyParse')) {
                                    if (global.web.set('bodyParse')) {
                                        var form1 = new formidable.IncomingForm();
                                        form1.parse(req, function (err, fields, files) {
                                            req.data = fields;
                                            for (var key in files) {
                                                if (files[key].path)
                                                    req.data[key] = fs.readFileSync(files[key].path).toString('utf8');
                                            }
                                            router.postHandler(req, res, path, exports.server);
                                        });
                                    } else {
                                        router.postHandler(req, res, path, exports.server);
                                    }
                                } else {
                                    router.postHandler(req, res, path, exports.server);
                                }
                            });
                            tasks.run();
                        }
                        break;
                    case "get":
                        var tasks = executeEventAsync("get");
                        tasks.assign(function () {
                            router.getHandler(req, res, path, exports.server);
                        });
                        tasks.run();
                        break;
                    case "delete":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            var tasks = executeEventAsync("delete");
                            tasks.assign("success", function () {
                                router.getHandler(req, res, path, exports.server);
                            });
                            tasks.run();
                        }
                        break;
                    case "head":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            var tasks = executeEventAsync("head");
                            tasks.assign("success", function () {
                                router.getHandler(req, res, path, exports.server);
                            });
                            tasks.run();
                        }
                        break;
                    case "trace":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            var tasks = executeEventAsync("put");
                            tasks.assign(function () {
                                res.send(req.header);
                            });
                            tasks.run();
                        }
                        break;
                }
            });
            tasks.run();
        });
    exports.server.urlHandlers = {};
    exports.server.getHandlers = {};
    exports.server.postHandlers = {};
    exports.server.putHandlers = {};
    exports.server.deleteHandlers = {};
    exports.server.headHandlers = {};
    exports.server.erorrHandlers = {};
    exports.server.blockMimes = {};
    exports.server.get = function (_gethandlers, handle) {
        var key;
        //Default set to current server
        if (handle) {
            this.getHandlers[_gethandlers] = handle;
        } else {
            for (key in _gethandlers)
                this.getHandlers[key] = _gethandlers[key];
        }
        return this;
    };
    exports.server.post = function (_posthandlers, handle) {
        var key;
        //Default set to current server
        if (handle) {
            this.postHandlers[_posthandlers] = handle;
        } else {
            for (key in _posthandlers)
                this.postHandlers[key] = _posthandlers[key];
        }
        return this;
    };
    exports.server.put = function (_puthandlers, handle) {
        var key;
        //Default set to current server
        if (handle) {
            this.putHandlers[_puthandlers] = handle;
        } else {
            for (key in _puthandlers)
                this.putHandlers[key] = _puthandlers[key];
        }
        return this;
    };
    exports.server.delete = function (_deletehandlers, handle) {
        var key;
        //Default set to current server
        if (handle) {
            this.deleteHandlers[_deletehandlers] = handle;
        } else {
            for (key in _deletehandlers)
                this.deleteHandlers[key] = _deletehandlers[key];
        }
        return this;
    };
    exports.server.head = function (_headhandlers, handle) {
        var key;
        //Default set to current server
        if (handle) {
            this.headHandlers[_headhandlers] = handle;
        } else {
            for (key in _headehandlers)
                this.headHandlers[key] = _headhandlers[key];
        }
        return this;
    };
    exports.server.url = function (_urlhandlers) {
        var key;
        //Default set to current server
        if (typeof _urlhandlers == 'object') {
            for (key in _urlhandlers) this.urlHandlers[key] = _urlhandlers[key];
        } else if (typeof _urlhandlers == 'string' && typeof server == 'string') {
            this.urlHandlers[_urlhandlers] = server;
        }
        return this;
    };
    exports.server.config = function (key, value) {
        switch (typeof key) {
            case "string":
                if (value) {
                    this.configs[key] = value;
                } else {
                    return this.configs[key];
                }
                break;
            case "object":
                for (var _key in key) this.configs[_key] = key[_key];
        }
    };
    exports.server.use = function (event, handle) {
        if (handle) {
            return this.on(event, handle);
        } else {
            return this.on('route', event);
        }
    };
    exports.server.on = function (event, handler) {
        global.web.on(event, handler);
        return this;
    };
    exports.server.once = function (event, handler) {
        global.web.once(event, handler);
        return this;
    };
    return exports.server;
};