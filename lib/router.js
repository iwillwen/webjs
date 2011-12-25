/*
 * @class Server router module
 */
var fs = require('fs'),
    url = require('url'),
    pathmo = require('path'),
    mimes = require('./mimes').mimes,
    asynclist = require('asynclist'),
    utils = require('./utils');
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
            case "index.html":
                if ("/" in server.urlHandlers) {
                    exports.urlHandler(req, res, '/', server);
                } else if ("/" in server.getHandlers) {
                    req.qs = url.parse(req.url, true).query;
                    server.getHandlers["/"](req, res, function() {
                        exports.urlHandler(req, res, '/', server);
                    });
                } else {
                    res.sendFile("index.html");
                }
                break;
            //Default static get or Url router
            default:
                var i = 0,
                    triggers = 0;
                for (var key in server.getHandlers) {
                    triggers++;
                    utils.restParser(key, getpath, function (args) {
                        req.path = args;
                        req.qs = url.parse(req.url, true).query;
                        process.nextTick(function () {
                            //Run the handler
                            server.getHandlers[key](req, res, function() {
                                process.nextTick(function () {
                                    exports.urlHandler(req, res, getpath, server, function () {
                                        process.nextTick(function () {
                                            if (server.erorrHandlers && server.erorrHandlers.get) {
                                                return server.erorrHandlers.get(req, res);
                                            } else {
                                                return send404(res);
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    }, function () {
                        i++;
                        if (i == triggers) process.nextTick(function () {
                            //No any get rules match, find in url rules
                            exports.urlHandler(req, res, getpath, server);
                        });
                    });
                }
                if (i == triggers) process.nextTick(function () {
                    //No any get rules match, find in url rules
                    exports.urlHandler(req, res, getpath, server);
                });
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
                utils.restParser(key, getpath, function (args) {
                    scriptfile = server.urlHandlers[key];
                    for (var arg in args)
                        scriptfile = scriptfile.replace('(:' + arg + ')', args[arg]);
                    if (/^http/.test(scriptfile)) {
                        //Redirect to specify url
                        res.redirect(scriptfile);
                        console.log('Redirected to ' + scriptfile);
                    }
                    var filename = scriptfile.replace(/\/\.\./g, ""),
                        basename = getpath == '/' ? 'index.html' : pathmo.basename(getpath);
                    if (pathmo.extname(filename) !== '') {
                        res.sendFile(filename);
                    } else if (/\/$/i.test(filename)) {
                        exports.fileHandler(req, res, scriptfile + basename, server);
                    } else {
                        exports.fileHandler(req, res, scriptfile + '/' + basename, server);
                    }
                }, function () {
                    scriptfile = server.urlHandlers[key];
                    var filename = scriptfile.replace(/\/\.\./g, ""),
                        basename = getpath == '/' ? 'index.html' : getpath,
                        format = pathmo.extname(scriptfile);
                    if (format == '') {
                        //relative static resources
                        if (/\/$/i.test(scriptfile)) {
                            exports.fileHandler(req, res, scriptfile + basename, server);
                        } else {
                            exports.fileHandler(req, res, scriptfile + '/' + basename, server);
                        }
                    } else {
                        exports.fileHandler(req, res, filename, server);
                    }
                });
            }
        } else {
            scriptfile = server.urlHandlers['/'];
            if (/^http/.test(scriptfile)) {
                //Redirect to specify url
                res.redirect(scriptfile);
                console.log('Redirected to ' + scriptfile);
            }
            var filename = scriptfile.replace(/\/\.\./g, ""),
                basename = 'index.html';
            if (pathmo.extname(filename) !== '') {
                process.nextTick(function () {
                    res.sendFile(filename);
                });
            } else if (/\/$/i.test(filename)) {
                process.nextTick(function () {
                    exports.fileHandler(req, res, scriptfile + basename, server);
                });
            } else {
                process.nextTick(function () {
                    exports.fileHandler(req, res, scriptfile + '/' + basename, server);
                });
            }
        }
    },
    exports.handler = function (method, req, res, postpath, server) {
        var i = 0,
            triggers = 0;
        for (var key in server[method + 'Handlers']) {
            triggers++;
            utils.restParser(key, getpath, function (args) {
                req.path = args;
                req.qs = url.parse(req.url, true).query;
                process.nextTick(function () {
                    //Run the handler
                    server[method + 'Handlers'][key](req, res, function() {
                        process.nextTick(function () {
                            if (server.erorrHandlers && server.erorrHandlers[method]) {
                                return server.erorrHandlers[method](req, res);
                            } else {
                                return send404(res);
                            }
                        })
                    });
                });
            }, function () {
                i++;
            });
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
            process.nextTick(function () {
                server.blockMimes[format](req, res);
            })
        } else {
            if (format.length == 1) {
                //SubDir
                if (/.\//.test(getpath)) {
                    if (global.web.listeners('static') !== undefined) {
                        req.url = getpath + 'index.html';
                        var staticHandlers = global.web.listeners('static');
                        var static = new asynclist(staticHandlers.map(function (handler) {
                            return function () {
                                handler(req, res, function() {
                                    static.trigger('static');
                                });
                            };
                        }));
                        static.assign(function () {});
                        static.run();
                    } else {
                        res.sendFile(getpath + 'index.html');
                    }
                } else {
                    if (global.web.listeners('static') !== undefined) {
                        req.url = getpath + '/index.html';
                        var staticHandlers = global.web.listeners('static');
                        var static = new asynclist(staticHandlers.map(function (handler) {
                            return function () {
                                handler(req, res, function() {
                                    static.trigger('static');
                                });
                            };
                        }));
                        static.assign(function () {});
                        static.run();
                    } else {
                        res.sendFile(getpath + '/index.html');
                    }
                }
            } else {
                //static resources
                if (global.web.listeners('static') !== undefined) {
                    req.url = getpath;
                    process.nextTick(function () {
                        var staticHandlers = global.web.listeners('static');
                        var static = new asynclist(staticHandlers.map(function (handler) {
                            return function () {
                                handler(req, res, function() {
                                    static.trigger('static');
                                });
                            };
                        }));
                        static.assign(function () {});
                        static.run();
                    });
                } else {
                    res.sendFile(getpath);
                }
            }
        }
    }