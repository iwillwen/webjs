//Modules
var fs = require("fs");
var pathmo = require('path');
var util = require('util');
//Foundation Server
var connect = require('connect');
var https = require('https');
var http = require('http');
var dataStream = require('dataStream');
var EventProxy = require('eventproxy');
var url = require('url');
var utils = require('./utils');
var middlewares = ['basicAuth', 'bodyParser', 'cookieParser', 'cookieSession', 'csrf', 'directory', 'errorHandler', 'favicon', 'json', 'limit', 'logger', 'methodOverride', 'multipart', 'query', 'responseTime', 'session', 'staticCache', 'urlencoded', 'vhost'];
function method (web) {

  //Method
  web.version = '0.6.1';

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
    return function (req, res, out) {
      var i = -1;
      function next () {
        i++;
        var layer = fn1[i];

        if (layer) {
          layer(req, res, next);
        } else {
          fn2(req, res, out);
        }
      }
      next();
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
    _server = _server || web.httpsServer || this;

    //Check if had use the router middleware
    if (!_server.setRouter) {
      _server.use.call(_server, web.router);
      _server.setRouter = true;
    }
    switch (typeof handlers) {
      /**
       * web.get({ ... });
       */
      case 'object':
        for(var key in handlers) {
          web.httpMethodHelper(method, key, handlers[key]);
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
          _server.rules[method][handlers] = new RegExp('^' + handlers.replace(/:([\w%$.-]*)/g, '([\\\w%$.-]*)').replace("(([\\\w%$.-]*))", '([\\\w%$.-]*)') + '$', 'i');
        } else {
          _server.rules[method][handlers] = /^([\/\w$%.-]*)$/i;
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
  web.route = function (method, handler) {
    var patch = web.patch();
    web.use(function (req, res, next) {
      if (req.method.toLowerCase() !== method.toLowerCase()) return next();
      patch(req, res, function() {
        handler(req, res, next);
      });
    });
    return this;
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
      var origin = server;
      server = function (req, res) {
        res.redirect(origin);
      }
    } else {
      for (var key in _urlhandlers) {
        var origin = _urlhandlers[key];
        _urlhandlers[key] = function (req, res) {
          res.redirect(origin);
        }
      }
    }
    return this.httpMethodHelper('get', _urlhandlers, server);
  };
  /*
   * @description 设置GET和POST响应错误时的错误响应
   * @param {Object} handlers 传入的ErorrHandlers*
   */
  web.error = function (handlers, server) {
    var _server = typeof server == 'object' ? server : web.server;
    _server = _server || web.httpsServer || this;

    switch (typeof handlers) {
      /**
       * web.err({ ... });
       */
      case 'object':
        for(var key in handlers) {
          this.error(key, handlers[key]);
        }
        break;
      /**
       * web.err(404, function (req, res) { ... });
       */
      case 'string':
      case 'number':
        if (_server.handlers.error === undefined) {
          _server.handlers.error = {};
        }
        _server.handlers.error[handlers] = server;
    }
    return this;
  };
  web.err = web.error;

  web.stack = [];
  if (web.isServer) web._use = web.use;
  web.use = function () {
    var _server = this.server || this.httpsServer || this;
    if (!this.isServer) this._use = _server.use;
    for (var i = 0; i < arguments.length; i++) {
      switch (typeof arguments[i]) {
        case "string":
          var route = arguments[i];
          i++;
          var handle = arguments[i];
          this._use.call(_server, route, handle);
          break;
        case "function":
        case "object":
          this._use.call(_server, arguments[i]);
          break;
      }
    }
    return this;
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
    host = host || '0.0.0.0';
    var server = connect.createServer();
    server.setRouter = false;
    server.self = server.listen(port, host);
    this.server = server;
    server.handlers = {};
    server.rules = {};
    this.emit('listening', port, host);
    return this;
  };
  /*
   * @description Run a HTTPS server. 启动HTTP Server的主方法
   * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
   * @param {Number} port Port to listen.(require) 监听的端口*
   * @param {String} host Domain to listen.(require) 监听的域名*
   */
  web.runHttps = function (opt, port, host) {
    port = port || 80;
    host = host || '0.0.0.0';
    var server = connect.createServer();
    var httpsServer = https.createServer(opt, server);
    server.setRouter = false;
    httpsServer.listen(port, host);
    server.self = httpServer;
    this.httpsServer = server;
    server.handlers = {};
    server.rules = {};
    this.emit('listening', port, host);
    return this;
  };
  web.fork = function (type, opt) {
    var _server = this.server || this.httpsServer;
    _server = _server || this;
    type = type || 'http';
    var s = this.create(type, opt);
    s.handlers = _server.handlers;
    s.rules = _server.rules;
    s.metas = _server.metas;
    return s;
  };

  web.disable = function (event, handle) {
    if (handle) {
      delete this.handlers[event][handle];
    } else {
      delete this.handlers.get[handle];
    }
    return web;
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
    if (arguments.length == 1) {
      switch (typeof file) {
        case "string":
          var extend = require(file);
          extend(this);
          break;
        case "object":
          var ext = file.ext || file.extend;
          ext(this);
          break;
        case "function":
          file(this);
          break;
      }
    } else {
      for (var i = 0; i < arguments.length; i++) {
        switch (typeof arguments[i]) {
          case "string":
            var extend = require(arguments[i]);
            extend(this);
            break;
          case "object":
            var ext = arguments[i].ext || arguments[i].extend;
            ext(this);
            break;
          case "function":
            arguments[i](this);
            break;
        }
      }
    }
    return this;
  };

  web.ext = function (name, handle) {
    web.__defineGetter__(name, function () {
      return handle
    });
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
  web.meta = web.set;
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
        web.server = server;
        global.server = server;
        server.isServer = true;
        exports.ext(server);
        return server;
        break;
      case 'https':
        var server = connect.createServer();
        var httpsServer = https.createServer(opt, server);
        server.setRouter = false;
        server.on('listening', function (port, host) {
          httpsServer.listen(port, host);
          server.self = httpServer;
        });
        web.httpsServer = server;
        global.httpsServer = server;
        server.isServer = true;
        exports.ext(server);
        return server;
        break;
      default:
        var server = connect.createServer();
        web.server = server;
        global.server = server;
        server.isServer = true;
        exports.ext(server);
        return server;
    }
  };
  web.dynamicHelpers = function (obj) {
    var self = this;
    return self.use(function (req, res, next) {
      var dynamicView = {};
      for (var key in obj) dynamicView[key] = obj[key](req, res);
      res.dynamicView = dynamicView;
      self.set('dynamicView', dynamicView);
      next();
    });
  };
  web.ext = function (name, handle) {
    web.__defineGetter__(name, function () {
      return handle
    });
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
  web.meta = web.set;
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
        web.server = server;
        global.server = server;
        server.isServer = true;
        exports.ext(server);
        return server;
        break;
      case 'https':
        var server = connect.createServer();
        var httpsServer = https.createServer(opt, server);
        server.setRouter = false;
        server.on('listening', function (port, host) {
          httpsServer.listen(port, host);
          server.self = httpServer;
        });
        web.httpsServer = server;
        global.httpsServer = server;
        server.isServer = true;
        exports.ext(server);
        return server;
        break;
      default:
        var server = connect.createServer();
        web.server = server;
        global.server = server;
        server.isServer = true;
        exports.ext(server);
        return server;
    }
  };

  web.render = function () {
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
    var dynamicHelpers = this.set('dynamicHelpers');
    for (var key in dynamicHelpers) view[key] = dynamicHelpers[key];
    var opt = (arguments.length > 2 ? arguments[1] : {});
    var ext = self.set('view engine') || 'jade';
    var engine = require(ext);
    var root = self.set('views');
    var render = EventProxy.create();
    if (!/\/$/i.test(root)) root += '/';
    render.all('layout', 'body', function (layout, body) {
      layout_view.body = body;
      engine.render(layout, layout_view, function (err, fin) {
        if (err) return callback(err);
        callback(null, fin);
      });
    });
    if (opt.layout !== false) {
      if (opt.layout === undefined || opt.layout === true) {
        fs.readFile(root + 'layout.' + ext, 'utf-8', function (err, layout) {
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
    fs.readFile(root + name + '.' + ext, 'utf-8', function (err, tmlp) {
      if (err) return self.sendError(500);
      engine.render(tmlp, view, function (err, body) {
        if (err) return self.sendError(500);
        render.trigger('body', body);
      });
    });
  };
  web.net = require('./net');

  //Middlewares
  fs.readdirSync(__dirname + '/middlewares').forEach(function(filename){
    if (!/\.js$/.test(filename)) return;
    var name = pathmo.basename(filename, '.js');
    function load(){ return require('./middlewares/' + name); }
    web.__defineGetter__(name, load);
  });
  for (var i = 0; i < middlewares.length; i++) {
    web[middlewares[i]] = connect[middlewares[i]];
  }
}
module.exports.ext = method;