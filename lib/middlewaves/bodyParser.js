var formidable = require('formidable');
var fs = require('fs');
module.exports = function () {
    return function (req, res, next) {
        var method = req.method;
        if (method !== 'POST' && method !== 'PUT') return next();
        var parser = new formidable.IncomingForm();
            parser.parse(req.dataStream, function (err, fields, files) {
                req.data = fields;
                var j = 0,
                    y = 0;
                for (var key in files) {
                    y++;
                    if (files[key].path) {
                        fs.readFile(files[key].path, function (err, data) {
                            i++;
                            if (!err) req.files[key] = data;
                            if (i == y) next();
                        });
                    }
                }
                if (JSON.stringify(files) === '{}') next();
            });
            req.ok();
    };
};