var fs = require('fs');
var Request = require('./../request');
var Response = require('./../response');
var asynclist = require('asynclist');
var url = require('url');
module.exports = function (path) {
    var self = this;
    global.web.set('static root', path);
    var middlewaves = global.web.server.listeners('route');
    var middlewavesRunner = new asynclist(middlewaves);
    global.web.server.on('request', function (_req, _res) {
        if (_req.method === 'GET')
            fs.stat(path + url.parse(_req.url).pathname, function (err, stat) {
                if (err) return;
                var req = new Request(_req);
                var res = new Response(_res);
                res.reqHeaders = req.headers;
                if (!stat.isFile()) {
                    middlewavesRunner.assign(function () {
                        res.sendFile(path + req.reqPath + (/\/$/i.test(req.reqPath) ? 'index.html' : '/index.html'), true);
                    });
                    return middlewavesRunner.run(req, res, function () {
                        middlewavesRunner.trigger(true);
                    });
                }
                middlewavesRunner.assign(function () {
                    res.sendFile(path + req.reqPath, true);
                });
                middlewavesRunner.run(req, res, function () {
                    middlewavesRunner.trigger(true);
                });
            });
    });
    return function (req, res, next) {next();};
};