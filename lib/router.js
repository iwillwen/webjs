/*
 * @class Server router module
 */
var fs = require('fs');
var url = require('url');
var pathmo = require('path');
var mimes = require('./mimes').mimes;
var asynclist = require('asynclist');
var async = process.nextTick;
var utils = require('./utils');
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
            var args = utils.restParser(key, server.rules.url[key], getpath);
            scriptfile = server.handlers.url[key];
            for (var arg in args) scriptfile = scriptfile.replace('(:' + arg + ')', args[arg]);
            if (/^http/.test(scriptfile)) {
                //Redirect to specify url
                res.redirect(scriptfile);
                console.log('Redirected to ' + scriptfile);
            }
            var basename = getpath == '/' ? 'index.html' : getpath.substr(1);
            if (pathmo.extname(scriptfile) !== '') {
                res.sendFile(scriptfile, true);
            } else if (/\/$/i.test(filename)) {
                exports.fileHandler(req, res, scriptfile + basename, server, web);
            } else {
                exports.fileHandler(req, res, scriptfile + '/' + basename, server, web);
            }
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
                res.sendFile(filename, true);
            } else if (/\/$/i.test(filename)) {
                exports.fileHandler(req, res, scriptfile + basename, server, web);
            } else {
                exports.fileHandler(req, res, scriptfile + '/' + basename, server, web);
            }
        }
    },
    exports.handler = function (method, req, res, key, postpath, server) {
        var args = utils.restParser(key, server.rules[method][key], postpath);
        req.path = args;
        //Run the handler
        server.handlers[method][key](req, res, function() {
            if (server.erorrHandlers && server.erorrHandlers[method]) {
                return server.erorrHandlers[method](req, res);
            } else {
                return send404(res);
            }
        });
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
        if (server.handlers.blockMimes !== undefined) {
            if (format in server.handlers.blockMimes)
                //Blocked the file format
                server.handlers.blockMimes[format](req, res);
        } else {
            fs.stat(req.reqPath, function (err, stat) {
                if (err) return res.sendError(404);
                if (self.lookup('get', req.reqPath)) return res.sendError(404);
                if (self.lookup('url', req.reqPath)) return res.sendError(404);
                if (!stat.isFile()) return res.sendFile(req.reqPath + (/\/$/i.test(req.reqPath) ? 'index.html' : '/index.html'), true);
                res.sendFile(req.reqPath, true);
            });
        }
    };