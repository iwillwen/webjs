var dataStream = require('dataStream');

module.exports = function (opt) {
    return function (req, res, next) {
        res.pipelining(function () {
            if (opt.enable.indexOf(res.format) !== -1) {
                var engine = require(res.format);
                var stream = new dataStream({ readable: false });
                var render = engine.render || engine.compile;
                var root = global.web.set('static root');
                stream.on('complate', function () {
                    var body = stream.body().toString();
                    stream.empty();
                    render(body, { paths: [root, root + '/css'] }, function (err, css) {
                        if (err) return stream.emit('data', body);
                        res.header('Content-Length', false);
                        res.header('Content-Type', 'text/css');
                        stream.emit('data', css);
                    });
                });
                return stream;
            }
        });
        next();
    };
};