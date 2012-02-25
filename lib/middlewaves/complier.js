var utils = require('../utils');
var fs = require('fs');
var pathmo = require('path');
var mimes = require('../mimes').mimes;
var http = require('http');
var expires = {
    cacheFormat: /html|htm|js|css|sass|scss|jade|ejs/g,
    maxAge: 60*60*24*365
};
var filesBuffers = {};
module.exports = function (opt) {
    return function (req, res, next) {
        http.ServerResponse.prototype.sendFile = function (fileName, found, _charset) {
            if (!found) if (/^\//.test(fileName)) fileName = fileName.substr(1);
            if (filesBuffers[fileName] === undefined) {
                fs.stat(fileName, function (err, stats) {
                    if (err) return res.sendError(404);
                    var size = stats.size;
                    var format = pathmo.extname(fileName);
                    var lastModified = stats.mtime.toUTCString();
                    var needRende = false;
                    var buffer;
                    format = format ? format.slice(1) : 'unknown';
                    var charset = mimes[format] + '; charset=UTF-8' || 'text/plain; charset=UTF-8';
                    if (_charset) charset = _charset + '; charset=UTF-8';
                    if (opt.enable.indexOf(format) !== -1) needRende = true;
                    var expires1 = new Date();
                    if (res.reqHeaders['range']) {
                        var range = utils.parseRange(res.reqHeaders['range'], size);
                        if (range) {
                            res.header('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + stats.size);
                            res.header('Content-Length', (range.end - range.start + 1));
                            var fileStream = fs.createReadStream(fileName, range);
                            if (needRende) buffer = new dataStream(fileStream);
                            res.status(206);
                        } else {
                            res.status(200);
                            res.header('Content-Length', size);
                            var fileStream = fs.createReadStream(fileName);
                            if (needRende) buffer = new dataStream(fileStream);
                        }
                    } else {
                        res.status(200);
                        res.header('Content-Length', size);
                        var fileStream = fs.createReadStream(fileName);
                        if (needRende) buffer = new dataStream(fileStream);
                    }
                    expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
                    res.header("Expires", expires1.toUTCString());
                    res.header("Cache-Control", "max-age=" + expires.maxAge);
                    res.header('Content-Type' , charset);
                    res.header('Last-Modified', lastModified);
                    var needCache = expires.cacheFormat.test(fileName);
                    if (needCache) {
                        filesBuffers[fileName] = new Buffer(size);
                        filesBuffers[fileName].lastModified = lastModified;
                        filesBuffers[fileName].size = size;
                        filesBuffers[fileName].charset = charset;
                    }
                    fileStream.on('data', function (chunk) {
                        if (!needRende) {
                            res.write(chunk);
                            if (needCache) filesBuffers[fileName].write(chunk.toString('utf8'));
                        }
                    }).on('end', function () {
                        if (!needRende) res.end();
                    });
                    if (needRende) {
                        var engine = require(format);
                        fileStream.on('end', function () {
                            buffer.on('data', function (before) {
                                var css = engine.render(before.toString(), function (e, file) {
                                    if (e) {
                                        filesBuffers[fileName] = before;
                                        filesBuffers[fileName].charset = 'text/' + format + '; charset=UTF-8';
                                        res.header('Content-Type', 'text/' + format + '; charset=UTF-8');
                                        res.end(before);
                                        return this;
                                    }
                                    filesBuffers[fileName] = file;
                                    filesBuffers[fileName].charset = 'text/css; charset=UTF-8';
                                    res.header('Content-Type', 'text/css; charset=UTF-8');
                                    res.end(file);
                                });
                                if (css) {
                                    try {
                                        filesBuffers[fileName] = css;
                                        filesBuffers[fileName].charset = 'text/css; charset=UTF-8';
                                        res.header('Content-Type', 'text/css; charset=UTF-8');
                                        res.end(css);
                                    } catch(ex) {
                                        css
                                            .on('success', function (file) {
                                                filesBuffers[fileName] = file;
                                                filesBuffers[fileName].charset = 'text/css; charset=UTF-8';
                                                res.header('Content-Type', 'text/css; charset=UTF-8');
                                                res.end(file);
                                            })
                                            .on('error', function (e) {
                                                filesBuffers[fileName] = before;
                                                filesBuffers[fileName].charset = 'text/' + format + '; charset=UTF-8';
                                                res.header('Content-Type', 'text/' + format + '; charset=UTF-8');
                                                res.end(before);
                                            });
                                    }
                                }
                            });
                            buffer.ok();
                        });
                    }
                });
            } else {
                res.header('Content-Type' , filesBuffers[fileName].charset);
                res.header('Last-Modified', filesBuffers[fileName].lastModified);
                res.header('Content-Length', filesBuffers[fileName].size);
                res.status(200);
                res.end(filesBuffers[fileName]);
            }
        };
    };
};