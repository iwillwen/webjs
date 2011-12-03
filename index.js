/*
 * @fileOverview
 * @author Will Wen Gunn
 * @version 0.3.5
 */
/*
 * @constructor webjs
 * @descripttion A simple HTTP, HTTPS and TCP framework for Node.js
 * @see <a href="https://github.com/iwillwen/webjs">web.js on Github</a>
 * @Simple Deployment require('webjs').run()
 */
//Modules
var fs = require("fs"),
    mu = require("mustache"),
	events = require('events'),
	util = require('util');
//Metas
var web = exports;
web.version = '0.3.5';
web.mime = require('./lib/mimes').mimes,
			web.metas = {},
			web.servers = [],
			web.httpsServers = [];
//Foundation Server
var http = require('./lib/http'),
	https = require('./lib/https');
	
//Method
web._ = function (fn1, fn2) {
	var fn = new Function ('req', 'res',
			 '	var next = function () { throw new Error("next"); };\n' +
			 '	try {\n' +
			 '		(' + fn1.toString() + ')(req, res, next);\n' +
			 '	} catch(ex) {\n' +
			 '		(' + fn2.toString() + ')(req, res, next);\n' +
			 '	}\n');
	return fn;
};
web.httpMethodHelper = function (method, handlers, server) {
	var _server = typeof server == 'object' ? server : web.server;
	switch (typeof handlers) {
		case 'object':
			for(var key in handlers)
				_server[method+'Handlers'][key] = handlers[key];
			break;
		case 'string':
			_server[method+'Handlers'][handlers] = server;
	}
	return this;
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
		return this.httpMethodHelper('post', _gethandlers, web._(server, fn));
	} else {
		return this.httpMethodHelper('post', _gethandlers, server);
	}
};
web.put = function (_puthandlers, server, fn) {
	if (fn) {
		return this.httpMethodHelper('put', _gethandlers, web._(server, fn));
	} else {
		return this.httpMethodHelper('put', _gethandlers, server);
	}
};
web.delete = function (_deletehandlers, server) {
	return this.httpMethodHelper('delete', _deletehandlers, server);
};
web.head = function (_headhandlers, server) {
	return this.httpMethodHelper('head', _headhandlers, server);
};
/*
 * @description Set a UrlRouter to current server or specify server. 设置当前或指定的Server的PostRouter
 * @param {Object} _posthandlers A UrlRouter or a UrlRule key.(require) 传入的PostRouter或是一个规则的key.*
 * @param {Object} server Specify server or a UrlRule origin. 可指定Server
 */
web.url = function (_urlhandlers, server) {
	var key;
	if (server) {
		if (typeof _urlhandlers == 'object') {
			for (key in _urlhandlers) server.urlHandlers[key] = _urlhandlers[key];
		} else if (typeof _urlhandlers == 'string' && typeof server == 'string') {
			web.server.urlHandlers[_urlhandlers] = server;
		}
	} else {
		for (key in _urlhandlers)
			web.server.urlHandlers[key] = _urlhandlers[key];
	}
	return this;
};
/*
 * @description Run a HTTP server. 启动HTTP Server的主方法
 * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
 * @param {Number} port Port to listen.(require) 监听的端口*
 * @param {String} host Domain to listen.(require) 监听的域名*
 * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
 */
web.run = function (getpath, port, host, backserver) {
	if (http.server == undefined) {
		http.server = http.createHttpServer();
		web.servers.push(http.server);
		web.server = http.server;
		console.log('Create server.');
	} else if (backserver) {
		//Not the first server.
		web.server = http.server = createHttpServer();
		console.log('Create new server.');
	}
	if (getpath == undefined) {
		//Default listen 80 port
		web.server.listen(80);
		web.server.port = 80;
		web.server.host = '127.0.0.1';
		console.log('Server is running on 127.0.0.1:80');
		if (backserver) {
			//Return the server obejct.
			return web.server;
		} else {
	 		return this;
		}
	} else {
		var key;
		for (key in getpath) {
			web.server.urlHandlers[key] = getpath[key];
		}
		if (port !== undefined) {
			if (host === undefined) {
				web.server.listen(port);
			} else {
				web.server.listen(port, host);
				web.server.host = host;
			}
			web.server.port = port;
		}
		if (backserver){
			//Return the server obejct.
			return web.server;
		} else {
			return this;
		}
	}
};
/*
 * @description Run a HTTPS server. 启动HTTP Server的主方法
 * @param {Object} getpath Set a UrlRouter to the server.(require) 传入的URLRouter*
 * @param {Number} port Port to listen.(require) 监听的端口*
 * @param {String} host Domain to listen.(require) 监听的域名*
 * @param {Boolean} backserver if will return the server object or not. 是否返回该Server对象(建议在启动多服务器的时候使用*)
 */
web.runHttps = function (getpath, port, host, backserver) {
	if (https.httpsServer == undefined) {
		https.httpsServer = https.createHttpsServer();
		web.httpsServers.push(https.httpsServer);
		web.httpsServer = https.httpsServer;
	} else 
	if (backserver) {
		https.server = createHttpsServer();
		web.httpsServer = https.server;
		console.log('Create new HTTPS server.');
	}
	if (getpath == undefined) {
		web.httpsServer.listen(80);
		web.server.port = 80;
		web.server.host = '127.0.0.1';
		console.log('Server is running on https://127.0.0.1:80');
		if (backserver) {
			return https.httpsServer;
		} else {
	 		return this;
		}
	} else {
		var key;
		for (key in getpath) {
			web.httpsServer.urlHandlers[key] = getpath[key];
		}
		if (port !== undefined) {
			if (host === undefined) {
				web.httpsServer.listen(port);
			} else {
				web.httpsServer.listen(port, host);
				web.server.host = host;
			}
			web.httpsServer.port = port;
		}
		if (backserver){
			return web.httpsServer;
		} else {
			return this;
		}
	}
};
web.use = function (event, handle) {
    var e = event ? event : 'route';
	return this.on(e, handle);
};
/*
 * @description Set the custom 404 page. 设置自定义404页面
 * @param {String} path 404 page file's name.(require) 需要设置的文件路径(不包括'/')*
 */
web.set404 = function (path) {
	fs.readFile(path, function (err, data) {
		http.page404 = data;
		https.page404 = data;
	});
	return this;
};
/*
 * @description 设置GET和POST响应错误时的错误响应
 * @param {Object} handlers 传入的ErorrHandlers*
 */
web.erorr = function (handlers, server) {
	var key;
	if (server) {
		for (key in handlers) {
			server.erorrHandlers[key] = handlers[key];
		}
	} else {
		for (key in handlers) {
			web.server.erorrHandlers[key] = handlers[key];
		}
	}
	return this;
};
/*
 * @description 禁止请求某些文件格式时的响应器
 * @param {Object} handlers 传入的响应器*
 */
web.noMimes = function (handlers, server) {
	var key;
	if (server) {
		for (key in handlers) {
			server.blockMimes[key] = handlers[key];
		}
	} else {
		for (key in handlers) {
			web.server.blockMimes[key] = handlers[key];
		}
	}
	return this;
};
/*
 * @description 设置一些需要用到的元数据
 * @param {String} key 元数据的Key*
 * @param {String} value 元数据的值*
 */
web.set = function (key, value) {
	if (value) {
		this.metas[key] = value;
	} else {
		return this.metas[key];
	}
	return this;
};
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
/*
 * @description 调用Mustache进行模板渲染
 * @param {String} 模板的名称
 * @param {Object} 
 */
web.render = function (tmlpName, obj) {
	tmlpName += web.metas.tmlpExtname ? '.' + web.metas.tmlpExtname : '.html';
	fs.readFile(web.metas.tmplDir + '/' + tmlpName, function (err, data) {
		return mu.to_html(data.toString(), obj)
	});
};
web.extend = function (file) {
	switch (typeof file) {
		case 'string':
			var extend = require(file);
			try {
				extend(modules);
			} catch (e) {
				extend.extend(modules);
			}
			break;
		case 'object':
			try {
				file(modules);
			} catch(e) {
				file.extend(modules);
			}
			break;
	}
	return this;
};
web.config = function (key, value) {
	switch (typeof key) {
		case 'string':
			if (value) {
				switch (key) {
					case 'view engine':
						web.set('view engine', value);
						eval('var ' + value + ' = require(' + value + ')');
						break;
					case 'template':
						eval('web.render = function (tmpl, view) {' +
							 '	fs.readFile(web.config(\'views\') + \'/\' + tmpl + \'' + value[1] + '\', function (err, data) {' +
							 '		return ' + value[0] + '(data.toString(), view);' + 
							 '	});' +
							 '};');
						break;
					case 'mode':
						switch (value) {
							case 'production':
							case 'pro':
								setInterval(function () {
									web.restart();
									}, 31536000);
								break;
							case 'development':
							case 'dev':
								web.on('route', function (req, res) {console.log(new Date().getTime() +' Start route: ' + req.ur);})
									.on('get', function (req, res) {console.log(new Date().getTime() +' Start get: ' + req.url);})
									.on('post', function (req, res) {console.log(new Date().getTime() +' Start post: ' + req.url);})
									.on('put', function (req, res) {console.log(new Date().getTime() +' Start put: ' + req.url);})
									.on('head', function (req, res) {console.log(new Date().getTime() +' Start head: ' + req.url);})
									.on('delete', function (req, res) {console.log(new Date().getTime() +' Start delete: ' + req.url);})
									.set('mode', 'dev');
								break;
						}
						break;
					default:
						web.metas[key] = value;
				}
			} else {
				return web.metas[key];
			}
			break;
		case 'object':
			for (var meta in key) 
				web.metas[meta] = key[meta];
			break;
	}
	return this;
};
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
web.create = function (type) {
	switch (type) {
		case 'http':
			var server = http.createHttpServer();
			return server;
			break;
		case 'https':
			var server = https.createHttpsServer();
			return server;
			break;
		default:
			var server = http.createHttpServer();
			return server;
	}
};
//TCP Server
web.net = require('./lib/net').net;
web.eventListeners = {};
web.on = function (event, callback) {
	if (this.eventListeners[event] !== undefined) {
		this.eventListeners[event].push(callback);
	} else {
		this.eventListeners[event] = [];
		this.eventListeners[event].push(callback);
	}
	return this;
};
web.once = function (event, callback) {
	var g = function () {
		web.removeListener(g.event, g);
		g.listener.apply(g, arguments);
	};
	g.event = event;
	g.listener = callback;
	this.on(event, g);
	return this;
};
web.listeners = function (event) {
	return this.eventListeners[event];
};
web.removeListener = function (event, callback) {
	var index = this.eventListeners[event].indexOf(callback);
	this.eventListeners[event].splice(index, 1);
	return this;
};
web.removeAllListener = function (event) {
	this.eventListeners[event] = [];
	return this;
};
global.web = web;