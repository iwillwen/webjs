var fs = require('fs');
module.exports = function (path) {
    var self = this;
    return function (req, res, next) {
        if (req.method !== 'GET') return next();
        fs.stat(path + req.reqPath, function (err, stat) {
            if (err) return next();
            if (self.lookup('get', req.reqPath)) return next();
            if (self.lookup('url', req.reqPath)) return next();
            if (!stat.isFile()) return res.sendFile(path + req.reqPath + (/\/$/i.test(req.reqPath) ? 'index.html' : '/index.html'), true);
            res.sendFile(path + req.reqPath, true);
        });
    };
};