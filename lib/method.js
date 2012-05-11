//Modules
var fs = require("fs");
var jade = require("jade");
var formidable = require('formidable');
var pathmo = require('path');
var util = require('util');
//Foundation Server
var http = require('./http');
var https = require('./https');
var session = require('./session');
var dataStream = require('dataStream');
var eventproxy = require('eventproxy').EventProxy;
var asynclist = require('asynclist');
var url = require('url');
var mimes = require('./mimes').mimes;
var utils = require('./utils');
var Request = require('./request');
var Response = require('./response');
function method (web) {
    //Method
    web.version = '0.5.4';

    /**
     * return a middlewaves collection iterator.
     * @param  {Function | Array} fn1 a middlewave or a collection of middlewaves
     * @param  {Function} fn2 Final handle
     * @return {Function}     a middlewaves collection iterator
     * 
     * web.get('/', 
     *     web._([
     *         function (req, res, next) {
     *             console.log('first middlewave');
     *             next();
     *         },
     *         function (req, res, next) {
     *             console.log('second middlewave');
     *             next();
     *         },
     *         function (req, res, next) {
     *             console.log('third middlewave');
     *             next();
     *         }],
     *         function (req, res) {
     *             res.send('Hello World');
     *         })
     *    );
     * 
     */
    web._ = function (fn1, fn2) {
        if (!util.isArray(fn1)) fn1 = [fn1];
        return function (req, res, next) {
            var tasks = new asynclist(fn1);
            tasks.assign(function () {
                fn2(req, res, next)
            }).run(req, res, function () {
                if (arguments[0] instanceof Error) return res.render('error/error', {
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
    };
    /**
     * HTTP/S server method setter.
     * @param  {String} method   HTTP method
     * @param  {Function} handlers Request handlers
     * @param  {Object} server   Server Object
     * @return {Object}          web controller
     */
    web.httpMethodHelper = function (method, handlers, server) {
        var _server = typeof server == 'object' ? server : web.server;
        _server = _server ? _server : web.httpsServer;
        _server = _server ? _server : this;
        var routerRule = [];
        var middlewaves = _server.listeners('route');
        switch (typeof handlers) {
            case 'object':
                for (key in handlers) web.httpMethodHelper(method, key, handlers[key]);
                break;
            case 'string':
                routerRule[handlers] = new RegExp('^' + handlers.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
                _server.on('request', function (_req, _res) {
                    if (_req.method.toLowerCase() === method && routerRule[handlers].test(url.parse(_req.url).pathname)) {
                        var req = new Request(_req);
                        var res = new Response(_res);
                        res.reqHeaders = req.headers;
                        var middlewavesRunner = new asynclist(middlewaves);
                        middlewavesRunner.assign(function () {
                            req.param = utils.restParser(handlers, routerRule[handlers], req.reqPath);
                            server(req, res);
                        }).run(req, res, function () {
                            middlewavesRunner.trigger(true);
                        });
                    }
                });
        }
        return this;
    };
    /**
     * Set a handle for every request. (Without routing)
     * @param  {String} method HTTP method
     * @param  {Function} method Request handle
     * @return {Object}        web controller
     * 
     * web.route('get', function (req, res) {
     *     res.send('Hello World');
     * });
     * 
     */
    web.route = function (method) {
        var handler = arguments[arguments.lenght - 1];
        if (arguments.lenght > 2) var middlewaves = arguments[1];
        if (middlewaves) {
            return this.httpMethodHelper(method, web._(middlewaves, handler));
        } else {
            return this.httpMethodHelper(method, handler);
        }
    };
    /**
     * Set a get router to current server or specify server.
     * @param  {String | Object}   _gethandlers | rule GetRouters or router's rule
     * @param  {Function | Object}   handle | server       router's handle or server object
     * @return {Object}                web controllers
     * 
     * web.get('/:name', function (req, res) {
     *     res.send('Hello ' + req.param.name + '!');
     * });
     * 
     * web.get('/:name', checkAuth, function (req, res) {
     *     res.send('Hello ' + req.param.name + '!');
     * });
     * 
     * //Middlewave
     * function checkAuth (req, res, next) {
     *     
     * }
     * 
     */
    web.get = function (_gethandlers, server, fn) {
        if (fn) {
            return this.httpMethodHelper('get', _gethandlers, web._(server, fn));
        } else {
            return this.httpMethodHelper('get', _gethandlers, server);
        }
    };
    /**
     * Set a post router to current server or specify server.
     * @param  {String | Object}   _posthandlers | rule PostRouters or router's rule
     * @param  {Function | Object}   handle | server       router's handle or server object
     * @return {Object}                web controllers
     * 
     * web.post('/new', function (req, res) {
     *     
     * })
     * 
     */
    web.post = function (_posthandlers, server, fn) {
        if (fn) {
            return this.httpMethodHelper('post', _posthandlers, web._(server, fn));
        } else {
            return this.httpMethodHelper('post', _posthandlers, server);
        }
    };
    /**
     * Set a post router to current server or specify server.
     * @param  {String | Object}   _posthandlers | rule PostRouters or router's rule
     * @param  {Function | Object}   handle | server       router's handle or server object
     * @return {Object}                web controllers
     */
    web.put = function (_puthandlers, server, fn) {
        if (fn) {
            return this.httpMethodHelper('put', _puthandlers, web._(server, fn));
        } else {
            return this.httpMethodHelper('put', _puthandlers, server);
        }
    };
    web.delete = function (_deletehandlers, server) {
        return this.httpMethodHelper('delete', _deletehandlers, server);
    };
    web.del = web.delete;
    web.head = function (_headhandlers, server) {
        return this.httpMethodHelper('head', _headhandlers, server);
    };
    /*
     * @description Set a UrlRouter to current server or specify server. 设置当前或指定的Server的PostRouter
     * @param {Object} _posthandlers A UrlRouter or a UrlRule key.(require) 传入的PostRouter或是一个规则的key.*
     * @param {Object} server Specify server or a UrlRule origin. 可指定Server
     */
    web.url = function (_urlhandlers, server) {
        return this.httpMethodHelper('url', _urlhandlers, server);
    };
    /*
     * @description 设置GET和POST响应错误时的错误响应
     * @param {Object} handlers 传入的ErorrHandlers*
     */
    web.error = function (handlers, server) {
        return this.httpMethodHelper('error', handlers, server);
    };
    /*
     * @description 禁止请求某些文件格式时的响应器
     * @param {Object} handlers 传入的响应器*
     */
    web.noMimes = function (handlers, server) {
        return this.httpMethodHelper('noMimes', handlers, server);
    };
    /**
     * Run a HTTP server. 启动HTTP Server的主方法
     * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
     * @param {Number} port Port to listen.(require) 监听的端口*
     * @param {String} host Domain to listen.(require) 监听的域名*
     * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
     * 
     * web.run(8888, 'mydomain.com');
     * 
     */
    web.run = function (port, host, backserver) {
        if (http.server === undefined) {
            http.server = http.createHttpServer();
            web.servers.push(http.server);
            web.server = http.server;
            console.log('Create server.');
        } else if (backserver) {
            //Not the first server.
            web.server = http.server = createHttpServer();
            console.log('Create new server.');
        }
        if (port !== undefined) {
            if (host === undefined) {
                web.server.listen(port);
            } else {
                web.server.listen(port, host);
                web.server.host = host;
            }
            web.server.port = port;
        } else {
            web.server.listen(80);
        }
        if (backserver){
            //Return the server obejct.
            return web.server;
        } else {
            return this;
        }
    };
    /*
     * @description Run a HTTPS server. 启动HTTP Server的主方法
     * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
     * @param {Number} port Port to listen.(require) 监听的端口*
     * @param {String} host Domain to listen.(require) 监听的域名*
     * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
     */
    web.runHttps = function (opt, port, host, backserver) {
        if (https.httpsServer === undefined) {
            https.httpsServer = https.createHttpsServer(opt);
            web.httpsServers.push(https.httpsServer);
            web.httpsServer = https.httpsServer;
        } else 
        if (backserver) {
            https.server = createHttpsServer(opt);
            web.httpsServer = https.server;
            console.log('Create new HTTPS server.');
        }
        if (port !== undefined) {
            if (host === undefined) {
                web.httpsServer.listen(port);
            } else {
                web.httpsServer.listen(port, host);
                web.httpsServer.host = host;
            }
            web.httpsServer.port = port;
        } else {
            web.httpsServer.listen(443);
        }
        if (backserver){
            return web.httpsServer;
        } else {
            return this;
        }
    };
    web.fork = function (type, opt) {
        var _server = typeof server == 'object' ? server : web.server;
        _server = _server ? _server : web.httpsServer;
        _server = _server ? _server : this;
        type = type || 'http';
        var s = this.create(type, opt);
        s.handlers = _server.handlers;
        s.rules = _server.rules;
        s.metas = _server.metas;
        return s;
    };
    web.use = function (event, handle) {
        var _server = typeof server == 'object' ? server : web.server;
        _server = _server ? _server : web.httpsServer;
        _server = _server ? _server : this;
        if (handle) {
            return _server.on(event, handle);
        } else {
            return _server.on('route', event);
        }
    };
    web.disable = function (event, handle) {
        if (handle) {
            return this.removeListener(event, handle);
        } else {
            return this.removeListener('route', event);
        }
    };
    /*
     * @description Set the custom 404 page. 设置自定义404页面
     * @param {String} path 404 page file's name.(require) 需要设置的文件路径(不包括'/')*
     */
    web.setErrorPage = function (statu, path) {
        fs.readFile(path, function (err, data) {
            web.ErrorPage[statu] = data;
        });
        return this;
    };
    web.ErrorPage = {};
    /*
     * @description 自定义MIME类型
     * @param {String} format 文件格式后缀*
     * @param {String} mime MIME类型*
     */
    web.reg = function (format, mime) {
        if (/^\./.test(format)) {
            this.mimes[format.substring(1)] = mime;
        } else {
            this.mimes[format] = mime;
        }
        return this;
    };
    web.extend = function (file) {
        var extend = require(file);
        extend(this);
        return this;
    };
    /*
     * @description 设置一些需要用到的元数据
     * @param {String} key 元数据的Key*
     * @param {String} value 元数据的值*
     */
    web.metas = {};
    web.config = function (key, value) {
        var self = this;
        switch (typeof key) {
            case 'string':
                if (value !== undefined) {
                    switch (key) {
                        case 'template':
                            web.render = function (tmlp, view, callback) {
                                if (web.set('views') === undefined) tmlp = web.set('views') + '/' + tmlp;
                                var engine = web.set('view engine') || require('jade');
                                fs.readFile(tmlp, function (err, data) {
                                    engine.render(data, view, callback);
                                });
                            };
                            break;
                        case 'mode':
                            switch (value) {
                                case 'production':
                                case 'pro':
                                    setInterval(function () {
                                        web.restart();
                                        }, 31536000);
                                    web.metas[key] = value;
                                    break;
                                case 'development':
                                case 'dev':
                                    global.web.logFile = fs.createWriteStream(web.set('dbgPath') + '/webjs-debug.log');
                                    setInterval(function () {
                                        web.restart();
                                    }, 18000000);
                                    web
                                        .on('route', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start route: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('get', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start get: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('psot', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start psot: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('put', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start put: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('delete', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start delete: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('head', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start head: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .on('trace', function (req, res, next) {
                                            var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Start trace: ' + req.reqPath;
                                            console.log(msg);
                                            web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            next();
                                        })
                                        .use(function (req, res, next) {
                                            next();
                                            res.on('http_error', function (err) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[31m Response error: ' + req.reqPath + ', statu: \x1b[1m' + err + '\x1b[0m';
                                                console.error(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                            res.on('render', function (name, view) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Rende template: ' + req.reqPath + ', template: ' + name + ', view: ' + JSON.stringify(view);
                                                console.log(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                            res.on('sendfile', function (name) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Response a file: ' + req.reqPath + ', file: ' + name;
                                                console.log(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                            res.on('sendJSON', function (obj) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Response a JSON obejct: ' + req.reqPath + ', obejct: ' + JSON.stringify(obj);
                                                console.log(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                            res.on('sendJSONP', function (obj) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Response a JSONP obejct: ' + req.reqPath + ', obejct: ' + JSON.stringify(obj);
                                                console.log(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                            res.on('setCookie', function (key, value) {
                                                var msg = '\x1b[36m' + new Date().toUTCString() +'\x1b[0m Set a cookie: ' + req.reqPath + ', name: ' + key + ', value: ' + value;
                                                console.log(msg);
                                                web.logFile.write(msg.replace(/\[36m|\[0m/g, '') + '\r\n');
                                            });
                                        });
                                    global.web.metas[key] = value;
                                    break;
                            }
                            break;
                        default:
                            self.metas[key] = value;
                            global.web.metas[key] = value;
                            self.emit('set', key, value);
                            self.emit('config', key, value);
                            global.web.emit('set', key, value);
                            global.web.emit('config', key, value);
                    }
                } else {
                    if (self.metas[key])
                        return self.metas[key]
                    else
                        return global.web.metas[key];
                }
                break;
            case 'object':
                for (var meta in key) {
                    self.metas[key] = value;
                    global.web.set(meta, key[meta]);
                }
                break;
        }
        return this;
    };
    web.set = web.config;
    /*
     * @description 重启服务器
     * @param {Object} server 服务器
     */
    web.restart = function (server) {
        if (server) {
            server.close();
            server.listen(server.port, server.host);
        } else {
            web.server.close();
            web.server.listen(web.server.port, web.server.host);
        }
        return this;
    };
    /*
     * @description 停止服务器
     * @param {Object} server 服务器
     */
    web.stop = function(server){
        server = server ? server : web.server;
        if(server.fd)
            server.close();
        return this;
    };
    /*
     * @description 生成一个服务器
     * @param {String} type 服务器的类型*
     * @param {Object} opt HTTPS服务器的SSL设置
     */
    web.create = function (type, opt) {
        switch (type) {
            case 'http':
                var server = http.createHttpServer();
                web.server = server;
                global.server = server;
                return server;
                break;
            case 'https':
                var server = https.createHttpsServer(opt);
                web.httpsServer = server;
                global.httpsServer = server;
                return server;
                break;
            default:
                var server = http.createHttpServer();
                web.server = server;
                global.server = server;
                return server;
        }
    };

    web.render = function () {
        this.emit('render');
        var self = this;
        var name = arguments[0];
        var view = arguments[arguments.length - 2];
        var callback = arguments[arguments.length - 1];
        var layout_view = {
            title: 'webjs starting'
        };
        if (view.local) {
            layout_view = view;
            view = view.local;
        }
        var opt = (arguments.length > 2 ? arguments[1] : {});
        var ext = self.set('view engine') || 'jade';
        var engine = require(ext);
        var root = self.set('views');
        var render = new eventproxy();
        if (!/\/$/i.test(root)) root += '/';
        render.assign('layout', 'body', function (layout, body) {
            layout_view.body = body;
            engine.render(layout, layout_view, function (err, fin) {
                if (err) return callback(err);
                callback(null, fin);
            });
        });
        if (opt.layout !== false) {
            if (opt.layout === undefined || opt.layout === true) {
                fs.readFile(root + 'layout.' + ext, function (err, layout) {
                    if (err) return render.trigger('layout', '#{body}');
                    render.trigger('layout', layout.toString());
                });
            } else {
                fs.readFile(root + opt.layout + '.' + ext, function (err, layout) {
                    if (err) return render.trigger('layout', '#{body}');
                    render.trigger('layout', layout.toString());
                });
            }
        } else {
            render.trigger('layout', '#{body}');
        }
        view.partial = function (tmlp) {
            return fs.readFileSync(root + tmlp + '.' + ext);
        };
        fs.readFile(root + name + '.' + ext, function (err, tmlp) {
            if (err) return self.sendError(500);
            engine.render(tmlp.toString(), view, function (err, body) {
                if (err) return self.sendError(500);
                render.trigger('body', body);
            });
        });
    };
    //TCP Server
    web.net = require('./net');
    //Middlewaves
    web.session = require('./middlewaves/session');
    web.cookieParser = require('./middlewaves/cookieParser');
    web.static = require('./middlewaves/static');
    web.bodyParser = require('./middlewaves/bodyParser');
    web.compiler = require('./middlewaves/complier');
    web.compress = require('./middlewaves/compress');
}
module.exports.ext = method;