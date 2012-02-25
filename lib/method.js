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
var dataStream = require('./dataStream');
var mimes = require('./mimes').mimes;
var utils = require('./utils');
function method (web) {
    //Method
    web.version = '0.4.9';
    web._ = function (fn1, fn2) {
        return function (req, res, next) {
            try {
                fn1(req, res, function (err) {
                    throw err;
                });
            } catch (ex) {
                fn2(req, res, next);
            }
        };
    };
    web.httpMethodHelper = function (method, handlers, server) {
        var _server = typeof server == 'object' ? server : web.server;
        _server = _server ? _server : web.httpsServer;
        _server = _server ? _server : this;
        switch (typeof handlers) {
            case 'object':
                for(var key in handlers) {
                    if (_server.handlers[method] === undefined && _server.handlers[method] === undefined) {
                        _server.handlers[method] = {};
                        _server.rules[method] = {};
                    }
                    _server.handlers[method][key] = handlers[key];
                    _server.rules[method][key] = new RegExp('^' + key.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
                }
                break;
            case 'string':
                if (_server.handlers[method] === undefined && _server.handlers[method] === undefined) {
                    _server.handlers[method] = {};
                    _server.rules[method] = {};
                }
                _server.handlers[method][handlers] = server;
                _server.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([a-zA-Z0-9-_$]*)/g, '(.*)').replace(/\(\(\.\*\)\)/, '(.*)') + '$', 'i');
        }
        return this;
    };
    web.lookup = function (method, route) {
        var _server = this.server ? this.server : this.httpsServer;
        _server = _server ? _server : this;
        if (_server.handlers[method] !== undefined)
            if (_server.handlers[method][route] !== undefined)
                return _server.handlers[method][route];
            else return false;
        else return false;
    };
    web.get = function (_gethandlers, server, fn) {
        if (fn) {
            return this.httpMethodHelper('get', _gethandlers, web._(server, fn));
        } else {
            return this.httpMethodHelper('get', _gethandlers, server);
        }
    };
    /*
     * @description Set a PostRouter to current server or specify server. 设置当前或指定的Server的PostRouter
     * @param {Object} _posthandlers A PostRouter(require) 传入的PostRouter*
     * @param {Object} server Specify server 可指定Server
     */
    web.post = function (_posthandlers, server, fn) {
        if (fn) {
            return this.httpMethodHelper('post', _posthandlers, web._(server, fn));
        } else {
            return this.httpMethodHelper('post', _posthandlers, server);
        }
    };
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
    /*
     * @description Run a HTTP server. 启动HTTP Server的主方法
     * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
     * @param {Number} port Port to listen.(require) 监听的端口*
     * @param {String} host Domain to listen.(require) 监听的域名*
     * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
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
        if (handle) {
            return this.on(event, handle);
        } else {
            return this.on('route', event);
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
                                    web.logFile = fs.createWriteStream(web.set('dbgPath') + '/webjs-debug.log');
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
                                        });
                                    web.metas[key] = value;
                                    break;
                            }
                            break;
                        default:
                            global.web.metas[key] = value;
                            web.metas[key] = value;
                    }
                } else {
                    if (global.web.metas[key])
                        return global.web.metas[key]
                    else
                        return web.metas[key];
                }
                break;
            case 'object':
                for (var meta in key) {
                    global.web.metas[key] = value;
                    web.set(meta, key[meta]);
                }
                break;
        }
        return this;
    };
    web.set = web.config;
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
    web.stop = function(server){
        server = server ? server : web.server;
        if(server.fd)
            server.close();
        return this;
    };
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
    //TCP Server
    web.net = require('./net');
    web.session = require('./middlewaves/session');
    web.cookieParser = require('./middlewaves/cookieParser');
    web.static = require('./middlewaves/static');
    web.bodyParser = require('./middlewaves/bodyParser');
    //web.compiler = require('./middlewaves/complier');
}
module.exports.ext = method;