/*
 * @class HTTP module
 */
var http = require("http"),
    fs = require("fs"),
    url = require("url"),
    formidable = require('formidable'),
    router = require('./router'),
    mimes = require('./mimes').mimes,
    events = require('events'),
    utils = require('./utils'),
    httpStatus = require('./httpstatus'),
    pathmo = require('path'),
    session = require('./session'),
    util = require('util');
//Jscex
var Jscex = require("jscex-jit");
require("jscex-async").init(Jscex);
require("./jscex-async-powerpack").init(Jscex);
//404 page
exports.page404 = "Page not found.";
var send404 = function (res) {
        res.send(exports.page404);
    };
var expires = {
    fileMatch: /^(gif|png|jpg|js|css)$/ig,
    maxAge: 60*60*24*365
};
/*
 * @function Create a HTTP Server
 */
exports.createHttpServer = function () {
    exports.server = http.createServer(function (req, res) {
            this.configs = {};
            var path = url.parse(req.url).pathname.substring(1);
            util.inherits(this, events.EventEmitter);
            // 解析Cookie
            res.continue = function () {
                throw new Error('continue');
            };
            res.next = res.continue;
            //res
            /*
             * @description Send a data to client. 发送数据到客户端 
             * @param {String} data Data to send(require) 发送的数据* 
             */
             res.long = function () {
                this.writeHead(200, {'Content-type' : 'text/html', 'Server': 'Node.js with webjs'});
                this.send = function (data) {
                    this.write(data);
                };
                return this;
                };
            res.send = function (data) {
                this.writeHead(200, {'Content-type' : 'text/html', 'Server': 'Node.js with webjs'});
                this.write(data);
                res.end();
                return this;
            };
            res.sendError = function (statu) {
                res.writeHead(statu, {'Server': 'Node.js with webjs'});
                res.end(httpStatus[String(statu)]);
                return this;
            };
            /*
             * @description Send a file to client. 发送指定文件到客户端
             * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
             */
            res.sendFile = function (fileName) {
                fs.stat(fileName, function (err, stats) {
                    if (err) return res.sendError(404);
                    var size = stats.size,
                        format = pathmo.extname(fileName),
                        fileStream = fs.createReadStream(fileName),
                        lastModified = stats.mtime.toUTCString();
                    format = format ? format.slice(1) : 'unknown';
                    this.charset = mimes[format] || "text/plain";
                    if (format.match(expires.fileMatch)) {
                        var expires1 = new Date();
                        expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
                        res.setHeader("Expires", expires1.toUTCString());
                        res.setHeader("Cache-Control", "max-age=" + expires.maxAge);
                    }
                    if (req.headers['If-Modified-Since'] && lastModified == request.headers['If-Modified-Since']) res.sendError(304);
                    res.writeHead(200, {'Content-Type' : this.charset, 'Last-Modified': lastModified, 'Content-Length': size});
                    fileStream.pipe(res);
                });
            };
            res.setHeader('Date', new Date().toUTCString());
            res.setHeader('Server', 'Node.js with webjs');
            res.setHeader('Accept-Ranges', 'bytes');
            /*
             * @description Send a JSON String to client. 发送JSON数据到客户端
             * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
             */
            res.sendJSON = function (data) {
                switch (typeof data) {
                    case "string":
                        this.charset = "application/json";
                        res.writeHead(200, {'Content-Type' : this.charset, 'Server': 'Node.js with webjs'});
                        res.write(data);
                        res.end();
                        break;
                    case "array":
                    case "object":
                        var sJSON = JSON.stringify(data);
                        this.charset = "application/json";
                        res.writeHead(200, {'Content-Type' : this.charset, 'Server': 'Node.js with webjs'});
                        res.write(sJSON);
                        res.end();
                        break;
                }
            };
            /*
             * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
             * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
             */
            res.sendJSONP = function (data) {
                switch (typeof data) {
                    /*
                     * JSON string data.
                     */
                    case "string":
                        this.charset = "application/json";
                        res.writeHead(200, {'Content-Type' : this.charset, 'Server': 'Node.js with webjs'});
                        res.write(req.qs.callback + '(' + data + ')');
                        res.end();
                        break;
                    /*
                     * Array or Object
                     */
                    case "array":
                    case "object":
                        var sJSON = JSON.stringify(data);
                        this.charset = "application/json";
                        res.writeHead(200, {'Content-Type' : this.charset, 'Server': 'Node.js with webjs'});
                        res.write(req.qs.callback + '(' + sJSON + ')');
                        res.end();
                        break;
                }
            };
            /*
             * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
             * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
             */
            res.redirect = function (url) {
                switch (url) {
                    /*
                     * Redirect to home.
                     */
                    case 'home':
                        res.writeHead(302, {'Location': url.parse(req.url).hostname, 'Server': 'Node.js with webjs'});
                        res.end();
                        console.log('Redirected to home');
                        break;
                    /*
                     * Back to the previous page.
                     */
                    case 'back':
                        res.send('javascript:history.go(-1)');
                        res.writeHead(302, {'Location': 'javascript:history.go(-1)', 'Server': 'Node.js with webjs'});
                        res.end();
                        console.log('Redirected to back');
                        break;
                    /*
                     * Refresh the client.
                     */
                    case 'refresh':
                        res.writeHead(302, {'Location': req.url, 'Server': 'Node.js with webjs'});
                        res.end();
                        console.log('Refresh the client');
                        break;
                    /*
                     * Redirected to specify url.
                     */
                    default:
                        res.writeHead(302, {'Location': url, 'Server': 'Node.js with webjs'});
                        res.end();
                        console.log('Refresh to ' + url);
                }
                return this;
            };
            /*
             * @description Set a cookies on the client. 在客户端设置cookies
             * @param {String} name name of the cookies.(require) cookies的名字*
             * @param {String} val content of the cookies.(require) cookies的数据*
             * @param {Object} options Detail options of the cookies. cookies的详细设置
             */
            res.setCookie = function (name, val, options) {
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
                this.setHeader('Set-Cookie', cookie);
                return this;
            };
            /*
             * @decription Claer the specify cookies. 清除某指定cookies
             * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
             * @param {Object} options Detail options of the cookies. cookies的详细设置
             */
            res.clearCookie = function (name, options) {
                this.cookie(name, '', options);
                return this;
            };
    
            /* 加入session支持 */
            /** 开启Session，执行后将可通过req.session来访问Session数据 */
            req.sessionStart = function () {
                session.start(req, res);
                return this;
            };
            /** 关闭Session，执行后删除Session数据 */
            req.sessionEnd = function () {
                session.end(req, res);
                return this;
            };
            //Request
            /*
             * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
             * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
             */
            req.type = function(type) {
                var contentType = this.headers['content-type'];
                if (!contentType) return;
                if (!~type.indexOf('/')) type = mimes[type];
                if (~type.indexOf('*')) {
                    type = type.split('/');
                    contentType = contentType.split('/');
                    if ('*' == type[0] && type[1] == contentType[1]) return true;
                    if ('*' == type[1] && type[0] == contentType[0]) return true;
                }
                return !! ~contentType.indexOf(type);
            };
            /*
             * @description Get the specify header in the request. 返回请求头中的指定数据
             * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
             */
            req.getHeader = function (sHeader) {
                if (this.headers[sHeader]) {
                    return this.headers[sHeader];
                } else {
                    return undefined;
                }
            };
            /*
             * Use the formidable to parse the post request.
             */
            var executeEventAsync = function (eventName) {
                var handlers = exports.server.listeners(eventName),
                    _handlers = global.web.listeners(eventName);
                for (var i = 0; i < _handlers.length; i++) handlers.push(_handlers[i]);
                if (handlers.length === 0) res.continue();
                res.nextTrigger = handlers.length;
                for (var j = 0;j < handlers.length;j++) {
                    var fn = function () {
                        handlers[j - 1](req, res, function() {
                            res.nextTrigger--;
                        });
                    };
                    setTimeout(fn, 0);
                }
                if (res.nextTrigger === 0) res.continue();
            };
            if (global.web.set('cookiesParse'))
                req.cookies = utils.unserializeCookie(req.headers.cookie) || {};
            if (global.web.set('sessionParse'))
                req.sessionStart();
            try {
                $await(executeEventAsync("route"));
            } catch(ex) {
                switch (req.method.toLowerCase()) {
                    case "post":
                        try {
                            $await(executeEventAsync("post"));
                        } catch(e) {
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
                        }
                        break;
                    case "put":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            try {
                                $await(executeEventAsync("put"));
                            } catch(ex1) {
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
                            }
                        }
                        break;
                    case "get":
                        try {
                            $await(executeEventAsync("get"));
                        } catch(ex2) {
                            router.getHandler(req, res, path, exports.server);
                        }
                        break;
                    case "delete":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            try {
                                $await(executeEventAsync("delete"));
                            } catch(ex3) {
                                router.deleteHandler(req, res, path, exports.server);
                            }
                        }
                        break;
                    case "head":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            try {
                                $await(executeEventAsync("head"));
                            } catch(ex4) {
                                router.headHandler(req, res, path, exports.server);
                            }
                        }
                        break;
                    case "trace":
                        if (exports.server.config('readonly')) {
                            return false;
                        } else {
                            try {
                                $await(executeEventAsync("readonly"));
                            } catch(ex5) {
                                res.send(req.header);
                            }
                        }
                        break;
                }
            }
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
    return exports.server;
};