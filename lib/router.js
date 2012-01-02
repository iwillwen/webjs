/*
 * @class Server router module
 */
var fs = require('fs'),
    url = require('url'),
    pathmo = require('path'),
    mimes = require('./mimes').mimes,
    asynclist = require('asynclist'),
    async = process.nextTick,
    utils = require('./utils');
exports.page404 = "Page not found.";
var send404 = function (res) {
        res.send(exports.page404);
    };
    /*
     * @description Url Router
     * @param {Object} req Request
     * @param {Object} res Response
     * @param {String} getpath Get Url
     * @param {Object} server Server object
     */
    exports.urlHandler = function (req, res, key, getpath, server, web) {
        var scriptfile;
        if (getpath !== '/') {
            utils.restParser(key, server.rules.url[key], getpath, function (args) {
                scriptfile = server.handlers.url[key];
                for (var arg in args) scriptfile = scriptfile.replace('(:' + arg + ')', args[arg]);
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
                    exports.fileHandler(req, res, scriptfile + basename, server, web);
                } else {
                    exports.fileHandler(req, res, scriptfile + '/' + basename, server, web);
                }
            }, function () {
                scriptfile = server.urlHandlers[key];
                var filename = scriptfile.replace(/\/\.\./g, ""),
                    basename = getpath == '/' ? 'index.html' : getpath,
                    format = pathmo.extname(scriptfile);
                basename = basename.replace(/\/\.\./g, "");
                if (format == '') {
                    //relative static resources
                    if (/\/$/i.test(scriptfile)) {
                        exports.fileHandler(req, res, scriptfile + basename, server, web);
                    } else {
                        exports.fileHandler(req, res, scriptfile + '/' + basename, server, web);
                    }
                } else {
                    exports.fileHandler(req, res, filename, server, web);
                }
            });
        } else {
            scriptfile = server.handlers.url['/'];
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
                    exports.fileHandler(req, res, scriptfile + basename, server, web);
                });
            } else {
                process.nextTick(function () {
                    exports.fileHandler(req, res, scriptfile + '/' + basename, server, web);
                });
            }
        }
    },
    exports.handler = function (method, req, res, postpath, server) {
        var i = 0,
            triggers = 0;
        for (var key in server.handlers[method]) {
            triggers++;
            utils.restParser(key, server.rules[method][key], getpath, function (args) {
                req.path = args;
                req.qs = url.parse(req.url, true).query;
                process.nextTick(function () {
                    //Run the handler
                    server.handlers[method][key](req, res, function() {
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
    exports.fileHandler = function (req, res, getpath, server, web) {
        var format = getpath == '' ? pathmo.extname(getpath) : 'html';
        if (format in server.handlers.blockMimes) {
            //Blocked the file format
            process.nextTick(function () {
                server.handlers.blockMimes[format](req, res);
            })
        } else {
            if (format.length == 1) {
                //SubDir
                if (/.\//.test(getpath)) {
                    if (web.listeners('static') !== undefined) {
                        req.url = getpath + 'index.html';
                        web.emit('static');
                    } else {
                        res.sendFile(getpath + 'index.html');
                    }
                } else {
                    if (web.listeners('static') !== undefined) {
                        req.url = getpath + '/index.html';
                        web.emit('static');
                    } else {
                        res.sendFile(getpath + '/index.html');
                    }
                }
            } else {
                //static resources
                if (web.listeners('static') !== undefined) {
                    req.url = getpath;
                    process.nextTick(function () {
                        web.emit('static');
                    });
                } else {
                    res.sendFile(getpath);
                }
            }
        }
    }