//Modules
var fs = require("fs");
var pathmo = require('path');
var util = require('util');
//Foundation Server
var connect = require('connect');
var https = require('https');
var http = require('http');
var dataStream = require('dataStream');
var eventproxy = require('eventproxy').EventProxy;
var asynclist = require('asynclist');
var url = require('url');
var utils = require('./utils');
var middlewares = ['basicAuth', 'bodyParser', 'cookieParser', 'cookieSession', 'csrf', 'directory', 'errorHandler', 'favicon', 'json', 'limit', 'logger', 'methodOverride', 'multipart', 'query', 'responseTime', 'session', 'staticCache', 'urlencoded', 'vhost'];
function method (web) {
    //Method
    web.version = '0.5.5';

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

        //Check if had use the router middlewave
        if (!_server.setRouter) {
            _server.use(_server.router);
            _server.setRouter = true;
        }
        switch (typeof handlers) {
            /**
             * web.get({ ... });
             */
            case 'object':
                for(var key in handlers) {
                    _server.httpMethodHelper(method, key, handlers[key]);
                }
                break;
            /**
             * web.get('/hello', function (req, res) { ... });
             */
            case 'string':
                if (_server.handlers[method] === undefined && _server.handlers[method] === undefined) {
                    _server.handlers[method] = {};
                    _server.rules[method] = {};
                }
                _server.handlers[method][handlers] = server;
                if (handlers !== '*') {
                    /**
                     * web.get('*', function (req, res) { //404 });
                     */
                    _server.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([\w%$-]*)/g, '([/\w%$-]*)').replace("(([/\w%$-]*))", '([/\w%$-]*)') + '$', 'i');
                } else {
                    _server.rules[method][handlers] = /^([\w$%-]*)$/i;
                }
        }

        return this;
    };
    web.handlers = {};
    web.rules = {};
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
        //Jump url
        if (typeof _urlhandlers == 'string') {
            server = function (req, res) {
                res.redirect(server);
            }
        } else {
            for (var key in _urlhandlers) {
                _urlhandlers[key] = function (req, res) {
                    res.redirect(_urlhandlers[key]);
                }
            }
        }
        return this.httpMethodHelper('url', _urlhandlers, server);
    };
    /*
     * @description 设置GET和POST响应错误时的错误响应
     * @param {Object} handlers 传入的ErorrHandlers*
     */
    web.error = function (handlers, server) {
        return this.httpMethodHelper('error', handlers, server);
    };
    /**
     * Run a HTTP server. 启动HTTP Server的主方法
     * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
     * @param {Number} port Port to listen.(require) 监听的端口*
     * @param {String} host Domain to listen.(require) 监听的域名*
     * 
     * web.run(8888, 'mydomain.com');
     * 
     */
    web.run = function (port, host) {
        port = port || 80;
        host = host || '127.0.0.1';
        var server = connect.createServer();
        server.setRouter = false;
        server.self = server.listen(port, host);
        exports.ext(server);
        web.server = server;
        http.ServerResponse.prototype.pipelining = function (callback) {
            this.on('beforeSend', callback);
            return this;
        };
        web.use = function () {
            server.use.apply(server, arguments);
            return web;
        };
        for (var i = 0; i < middlewares.length; i++) {
            web[middlewares[i]] = connect[middlewares[i]];
        }
        return web;
    };
    /*
     * @description Run a HTTPS server. 启动HTTP Server的主方法
     * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
     * @param {Number} port Port to listen.(require) 监听的端口*
     * @param {String} host Domain to listen.(require) 监听的域名*
     */
    web.runHttps = function (opt, port, host) {
        port = port || 80;
        host = host || '127.0.0.1';
        var server = connect.createServer();
        var httpsServer = https.createServer(opt, server);
        server.setRouter = false;
        httpsServer.listen(port, host);
        server.self = httpServer;
        exports.ext(server);
        https.ServerResponse.prototype.pipelining = function (callback) {
            this.on('beforeSend', callback);
            return this;
        };
        web.use = function () {
            server.use.apply(server, arguments);
            return web;
        };
        web.httpsServer = server;
        return web;
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
                                    web.use(web.logger('dev'));
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
            server.self.close();
            server.self.listen(server.port, server.host);
        } else {
            web.server.self.close();
            web.server.self.listen(web.server.port, web.server.host);
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
            server.self.close();
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
                var server = connect.createServer();
                http.ServerResponse.prototype.pipelining = function (callback) {
                    this.on('beforeSend', callback);
                    return this;
                };
                web.server = server;
                global.server = server;
                return server;
                break;
            case 'https':
                var server = connect.createServer();
                https.ServerResponse.prototype.pipelining = function (callback) {
                    this.on('beforeSend', callback);
                    return this;
                };
                var httpsServer = https.createServer(opt, server);
                server.setRouter = false;
                server.on('listening', function (port, host) {
                    httpsServer.listen(port, host);
                    server.self = httpServer;
                });
                web.httpsServer = server;
                global.httpsServer = server;
                return server;
                break;
            default:
                var server = connect.createServer();
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

    //Middlewares
    fs.readdirSync(__dirname + '/middlewares').forEach(function(filename){
        if (!/\.js$/.test(filename)) return;
        var name = pathmo.basename(filename, '.js');
        function load(){ return require('./middlewares/' + name); }
        web.__defineGetter__(name, load);
    });

}
module.exports.ext = method;
