module.exports = function (opt) {
    var exts = ['html', 'css', 'js', 'less', 'sass', 'scss', 'coffee'];
    opt = opt || {};
    opt.enable = opt.enable || [];
    Array.prototype.push.apply(exts, opt.enable);
    return function (req, res, next) {
        var zlib = require('zlib');
        res.pipelining(function () {
            var need = exts.indexOf(res.format) !== -1;
            var acceptEncoding = req.headers['accept-encoding'] || "";
            if (need && acceptEncoding.match(/\bgzip\b/)) {
                res.header('Content-Encoding', 'gzip');
                res.header('Content-Length', false);
                res.gzip = true;
                return zlib.createGzip();
            } else if (need && acceptEncoding.match(/\bdeflate\b/)) {
                res.header('Content-Encoding', 'deflate');
                res.header('Content-Length', false);
                res.deflate = true;
                return zlib.createDeflate();
            }
        });
        next();
    };
};