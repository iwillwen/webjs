/*
 * @class Server router module
 */
var fs = require('fs'),
    url = require('url'),
	pathmo = require('path'),
	mimes = require('./mimes').mimes;
exports.page404 = "Page not found.";
var send404 = function (res) {
		res.send(exports.page404);
	};
/*
 * @description Get Method Router
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} getpath Get Url
 * @param {Object} server Server object
 */
exports.getHandler = function (req, res, getpath, server) {
		switch (getpath) {
			//Index
			case "":
				if ("/" in server.urlHandlers) {
					exports.urlHandler(req, res, '/', server);
				} else if ("/" in server.getHandlers) {
					req.qs = url.parse(req.url, true).query;
					server.getHandlers["/"](req, res, function() {return res.continue();});
				} else {
					res.sendFile("index.html");
				}
				break;
			//Favicon Icon
			case "favicon.ico":
				res.sendFile("favicon.ico");
				break;
			//Default static get or Url router
			default:
				for (var key in server.getHandlers) {
					var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '/(.*)')
									.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
					if (_key.substring(0, 2) == '/:')
						_key = _key.substring(2);
					else if (_key.substring(0, 1) == '/' && _key.length > 1)
						_key = _key.substring(1);
					_key = '^' + _key + '$';
					// console.log(key + '	 ' + _key);
					
					var uhReg = new RegExp(_key, "i");
					if (uhReg.test(getpath)) {
						//Replace the RESTful key
						var $key = key,
							keys = [];
						for (var i = 0; i < 10; i++) {
							$key = $key.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
							keys.push(RegExp['$1']);
							$key = $key.replace(/\/:\(\.\*\)/i, '\\/(.*)')
										.replace(/\(:\(\.\*\)\)/i, '(.*)');
							if (!/:([a-zA-Z0-9-_.$]*)/g.test($key)) break;
						}
						try {
							req.path = {};
							uhReg.test(getpath);
							//Fetch the RESTful key
							for (var i = 1;i < 10;i++)
								if (RegExp['$' + i] !== '')
									req.path[keys[i - 1]] = RegExp['$' + i];
							//Run the handler
							req.qs = url.parse(req.url, true).query;
							server.getHandlers[key](req, res, function() {throw new Error('nextHandler')});
						} catch(ex) {
							//Get handler go wrong
							if (ex.message !== 'continue') {
								if (global.web.set('mode') == 'dev')
									console.log('GET error: ' + ex.stack);
								if (server.erorrHandlers && server.erorrHandlers.get) {
									return server.erorrHandlers.get(req, res, ex);
								} else {
									return send404(res);
								}
							} else if (ex.message !== 'nextHandler') {
								exports.urlHandler(req, res, getpath, server);
								return;
							} else {
								continue;
							}
						}
					}
				}
				//No any get rules match, find in url rules
				exports.urlHandler(req, res, getpath, server);
		}
	},
	/*
	 * @description Url Router
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Get Url
	 * @param {Object} server Server object
	 */
	exports.urlHandler = function (req, res, getpath, server) {
		var scriptfile;
		if (getpath !== '/') {
			for (var key in server.urlHandlers) {
				//Replace the RESTful key
				var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '\\/(.*)')
								.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
				if (/\//.test(_key)) _key = _key.substring(2);
				var uhReg = new RegExp(_key, "i");
				if (uhReg.test(getpath)) {
					scriptfile = server.urlHandlers[key];
					var _keys = [];
					//Replace the params to key
					for (var i = 1; i < 10;i++)
						if (RegExp['$' + i] !== '')
							scriptfile = scriptfile.replace('$' + i, RegExp['$' + i]);
					break;
				}
			}
		} else {
			scriptfile = server.urlHandlers['/'];
		}
		//Redirect to specify url
		if (/^http/.test(scriptfile)) {
			res.writeHead(302, {'Location': scriptfile});
			res.end();
			console.log('Redirected to ' + scriptfile);
			return;
		}
		//finded a match url rule
		if (scriptfile !== undefined) {
			var filename = scriptfile.replace(/\/\.\./g, ""),
				basename = getpath == '/' ? 'index.html' : pathmo.basename(getpath);
			if (/(.*)\.(.*)/i.test(filename)) {
				fs.stat(filename, function (err) {
					if (err) return send404(res);
				});
				var format = pathmo.extname(filename),
					fileStream = fs.createReadStream(filename);
				format = format ? format.slice(1) : 'unknown';
				this.charset = mimes[format] || "text/plain";
				res.writeHead(200, {'Content-Type' : this.charset, 'Server': 'Node.js with webjs'});
				fileStream.pipe(res);
			} else if (/\/$/i.test(filename)) {
				exports.fileHandler(req, res, scriptfile + basename, server);
			} else {
				exports.fileHandler(req, res, scriptfile + '/' + basename, server);
			}
		} else {
			//static resources
			exports.fileHandler(req, res, getpath, server);
		}
	},
	/*
	 * @description Post method router
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Post Url
	 * @param {Object} server Server object
	 */
	exports.postHandler = function (req, res, postpath, server) {
		for (var key in server.postHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '/(.*)')
						.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
			if (_key.substring(0, 2) == '/:')
				_key = _key.substring(2);
			else if (_key.substring(0, 1) == '/' && _key.length > 1)
				_key = _key.substring(1);
			_key = '^' + _key + '$';
			// console.log(key + '	 ' + _key);
			
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 0; i < 10; i++) {
				$key = $key.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
				keys.push(RegExp['$1']);
				$key = $key.replace(/\/:\(\.\*\)/i, '\\/(.*)')
							.replace(/\(:\(\.\*\)\)/i, '(.*)');
				if (!/:([a-zA-Z0-9-_.$]*)/g.test($key)) break;
			}
			if (uhReg.test(postpath)) {
				try {
					var pathReg = {};
					//Replace the params to key
					for (var i = 1;i < 10;i++)
						if (RegExp['$' + i] !== '')
							pathReg[keys[i - 1]] = RegExp['$' + i];
					res.writeHead(200, {'Content-type':'text/html'});
					req.path = pathReg;
					//Run the handler
					server.postHandlers[key](req, res, function() {return res.continue();});
				} catch(ex) {
					//Post handler go wrong
					console.log('POST error: ' + ex.stack);
					if (server.erorrHandlers && server.erorrHandlers.post) {
						return server.erorrHandlers.post(req, res, ex);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	 /*
	 * @description Static resources sender
	 * @param {Object} req Request
	 * @param {Object} res Response
	 * @param {String} getpath Get Url
	 * @param {Object} server Server object
	 */
    exports.fileHandler = function (req, res, getpath, server) {
		var format = getpath == '' ? pathmo.extname(getpath) : 'html';
		if (format in server.blockMimes) {
			//Blocked the file format
			server.blockMimes[format[format.length - 1]](req, res);
		} else {
			if (format.length == 1) {
				//SubDir
				if (/.\//.test(getpath)) {
					if (global.web.listeners('static') !== undefined) {
						req.url = getpath + 'index.html';
						global.web.listeners('static')[0](req, res, function() {return res.continue();})
					} else {
						res.sendFile(getpath + 'index.html');
					}
				} else {
					if (global.web.listeners('static') !== undefined) {
						req.url = getpath + '/index.html';
						global.web.listeners('static')[0](req, res, function() {return res.continue();})
					} else {
						res.sendFile(getpath + '/index.html');
					}
				}
			} else {
				//static resources
				if (global.web.listeners('static') !== undefined) {
					req.url = getpath;
					global.web.listeners('static')[0](req, res, function() {return res.continue();})
				} else {
					res.sendFile(getpath);
				}
			}
		}
	},
	exports.putHandler = function (req, res, putpath, server) {
		for (var key in server.putHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '/(.*)')
						.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
			if (_key.substring(0, 2) == '/:')
				_key = _key.substring(2);
			else if (_key.substring(0, 1) == '/' && _key.length > 1)
				_key = _key.substring(1);
			_key = '^' + _key + '$';
			// console.log(key + '	 ' + _key);
			
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 0; i < 10; i++) {
				$key = $key.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
				keys.push(RegExp['$1']);
				$key = $key.replace(/\/:\(\.\*\)/i, '\\/(.*)')
							.replace(/\(:\(\.\*\)\)/i, '(.*)');
				if (!/:([a-zA-Z0-9-_.$]*)/g.test($key)) break;
			}
			if (uhReg.test(putpath)) {
				try {
					var pathReg = {};
					//Replace the params to key
					for (var i = 1;i < 10;i++)
						if (RegExp['$' + i] !== '')
							pathReg[keys[i - 1]] = RegExp['$' + i];
					res.writeHead(200, {'Content-type':'text/html'});
					req.path = pathReg;
					//Run the handler
					server.putHandlers[key](req, res, function() {return res.continue();});
				} catch(ex) {
					//put handler go wrong
					console.log('put error: ' + ex.stack);
					if (server.erorrHandlers && server.erorrHandlers.put) {
						return server.erorrHandlers.put(req, res, ex);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	exports.deleteHandler = function (req, res, deletepath, server) {
		for (var key in server.deleteHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '/(.*)')
						.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
			if (_key.substring(0, 2) == '/:')
				_key = _key.substring(2);
			else if (_key.substring(0, 1) == '/' && _key.length > 1)
				_key = _key.substring(1);
			_key = '^' + _key + '$';
			// console.log(key + '	 ' + _key);
			
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 0; i < 10; i++) {
				$key = $key.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
				keys.push(RegExp['$1']);
				$key = $key.replace(/\/:\(\.\*\)/i, '\\/(.*)')
							.replace(/\(:\(\.\*\)\)/i, '(.*)');
				if (!/:([a-zA-Z0-9-_.$]*)/g.test($key)) break;
			}
			if (uhReg.test(deletepath)) {
				try {
					var pathReg = {};
					//Replace the params to key
					for (var i = 1;i < 10;i++)
						if (RegExp['$' + i] !== '')
							pathReg[keys[i - 1]] = RegExp['$' + i];
					res.writeHead(200, {'Content-type':'text/html'});
					req.path = pathReg;
					//Run the handler
					server.deleteHandlers[key](req, res, function() {return res.continue();});
				} catch(ex) {
					//delete handler go wrong
					console.log('delete error: ' + ex.stack);
					if (server.erorrHandlers && server.erorrHandlers.delete) {
						return server.erorrHandlers.delete(req, res, ex);
					} else {
						return send404(res);
					}
				}
			}
		}
	},
	exports.headHandler = function (req, res, headpath, server) {
		for (var key in server.headHandlers) {
			//Replace the RESTful key
			var _key = key.replace(/\/:([a-zA-Z0-9-_$]*)/g, '/(.*)')
						.replace(/\(:([a-zA-Z0-9-_$]*)\)/g, '(.*)');
			if (_key.substring(0, 2) == '/:')
				_key = _key.substring(2);
			else if (_key.substring(0, 1) == '/' && _key.length > 1)
				_key = _key.substring(1);
			_key = '^' + _key + '$';
			// console.log(key + '	 ' + _key);
			
			var $key = key,
				uhReg = new RegExp(_key, "i"),
				keys = [];
			for (var i = 0; i < 10; i++) {
				$key = $key.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
				keys.push(RegExp['$1']);
				$key = $key.replace(/\/:\(\.\*\)/i, '\\/(.*)')
							.replace(/\(:\(\.\*\)\)/i, '(.*)');
				if (!/:([a-zA-Z0-9-_.$]*)/g.test($key)) break;
			}
			if (uhReg.test(headpath)) {
				try {
					var pathReg = {};
					//Replace the params to key
					for (var i = 1;i < 10;i++)
						if (RegExp['$' + i] !== '')
							pathReg[keys[i - 1]] = RegExp['$' + i];
					res.writeHead(200, {'Content-type':'text/html'});
					req.path = pathReg;
					//Run the handler
					server.headHandlers[key](req, res, function() {return res.continue();});
				} catch(ex) {
					//head handler go wrong
					console.log('head error: ' + ex.stack);
					if (server.erorrHandlers && server.erorrHandlers.head) {
						return server.erorrHandlers.head(req, res, ex);
					} else {
						return send404(res);
					}
				}
			}
		}
	}