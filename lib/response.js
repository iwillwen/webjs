var fs = require("fs"),
    url = require("url"),
    mimes = require('./mimes').mimes,
    utils = require('./utils'),
    async = process.nextTick,
    httpStatus = require('./httpstatus').status,
    pathmo = require('path');
var expires = {
    maxAge: 60*60*24*365
};
var filesBuffers = {};
function send (data, res) {
    res.statusCode = 200;
    res.end(data);
}
function long (res) {
    res.send = function (data) {
        res.statusCode = 200;
        this.write(data);
    };
}
function sendError (statu, res, web) {
    var data = web.ErrorPage[statu] ? web.ErrorPage[statu] : httpStatus[String(statu)];
    res.statusCode = statu;
    res.setHeader('Content-Type', "text/plain");
    res.end(data);
}
function sendfile (_fileName, res, req) {
    if (filesBuffers[_fileName] == undefined ) {
        fs.stat(_fileName, function (err, stats) {
            if (err) return res.sendError(404);
            var acceptEncoding = req.headers['accept-encoding'] || "",
                size = stats.size,
                format = pathmo.extname(_fileName),
                fileStream = fs.createReadStream(pathmo.resolve(__dirname, '../../../' + _fileName)),
                lastModified = stats.mtime.toUTCString();
            format = format ? format.slice(1) : 'unknown';
            var charset = mimes[format] || "text/plain",
                expires1 = new Date();
            expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
            res.setHeader("Expires", expires1.toUTCString());
            res.setHeader("Cache-Control", "max-age=" + expires.maxAge);
            if (req.headers['If-Modified-Since'] && lastModified == request.headers['If-Modified-Since']) return res.sendError(304);
            res.setHeader('Content-Type' , charset);
            res.setHeader('Last-Modified', lastModified);
            res.setHeader('Content-Length', size);
            filesBuffers[_fileName] = new Buffer(size);
            res.statusCode = 200;
            fileStream.on('data', function (chunk) {
                res.write(chunk);
                filesBuffers[_fileName].write(chunk.toString('utf8'));
            }).on('end', function () {
                res.end();
            });
        });
    } else {
        res.end(filesBuffers[_fileName]);
    }
}
function sendFile (filename, res, req, web) {
    if ('/' in web.server.handlers) {
        if (new RegExp(web.server.handlers.url['/'], 'i').test(fileName)) {
            return async(function () {
                sendfile(fileName, res, req);
            });
        } else if (/\/$/i.test(web.server.handlers.url['/']) && !/^\//i.test(fileName)) {
            return async(function () {
                sendfile(web.server.handlers.url['/'] + fileName, res, req);
            });
        } else {
            return async(function () {
                sendfile(web.server.handlers.url['/'] + '/' + fileName, res, req);
            });
        }
    }
    async(function () {
        sendfile(filename, res, req);
    });
}
function sendJSON (data, res) {
    switch (typeof data) {
        case "string":
            var charset = "application/json";
            res.statusCode = 200;
            res.setHeader('Content-Type', charset);
            res.write(data);
            res.end();
            break;
        case "array":
        case "object":
            var sJSON = JSON.stringify(data),
                charset = "application/json";
            res.statusCode = 200;
            res.setHeader('Content-Type', charset);
            res.write(sJSON);
            res.end();
            break;
    }
}
function sendJSONP (data, res, req) {
    switch (typeof data) {
        case "string":
            this.charset = "application/json";
            res.statusCode = 200;
            res.setHeader('Content-Type', charset);
            res.write(req.qs.callback + '(' + data + ')');
            res.end();
            break;
        case "array":
        case "object":
            var sJSON = JSON.stringify(data);
            this.charset = "application/json";
            res.statusCode = 200;
            res.setHeader('Content-Type', charset);
            res.write(req.qs.callback + '(' + sJSON + ')');
            res.end();
            break;
    }
}
function redirect (url, res, req) {
    switch (url) {
        /*
         * Redirect to home.
         */
        case 'home':
            res.writeHead(302, {'Location': url.parse(req.url).hostname});
            res.end();
            console.log('Redirected to home');
            break;
        /*
         * Back to the previous page.
         */
        case 'back':
            res.send('javascript:history.go(-1)');
            res.writeHead(302, {'Location': 'javascript:history.go(-1)'});
            res.end();
            console.log('Redirected to back');
            break;
        /*
         * Refresh the client.
         */
        case 'refresh':
            res.writeHead(302, {'Location': req.url});
            res.end();
            console.log('Refresh the client');
            break;
        /*
         * Redirected to specify url.
         */
        default:
            res.writeHead(302, {'Location': url});
            res.end();
            console.log('Refresh to ' + url);
    }
}
function setCookie (name, val, options, res) {
    if (typeof options != 'object')
        options = {};
    if (typeof options.path != 'string')
        options.path = '/';
    if (!(options.expires instanceof Date))
        options.expires = new Date();
    if (isNaN(options.maxAge))
        options.maxAge = 0;
    options.expires.setTime(options.expires.getTime() + options.maxAge * 1000);
    var cookie = utils.serializeCookie(name, val, options);
    var oldcookie = res.getHeader('Set-Cookie');
    if (typeof oldcookie != 'undefined')
        cookie = oldcookie + '\r\nSet-Cookie: ' + cookie;
    res.setHeader('Set-Cookie', cookie);
}
module.exports = function (res, req, web, cb) {
    //res
    /*
     * @description Send a data to client. 发送数据到客户端 
     * @param {String} data Data to send(require) 发送的数据* 
     */
    res.long = function () {
        async(function () {
            long(res);
        });
        return this;
    };
    res.send = function (data) {
        async(function () {
            send(data, res);
        });
        return this;
    };
    res.sendError = function (statu) {
        async(function () {
            sendError(statu, res, web);
        });
        return this;
    };
    /*
     * @description Send a file to client. 发送指定文件到客户端
     * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
     */
    res.sendFile = function (fileName) {
        async(function () {
            sendFile(fileName, res, req, web);
        });
        return this;
    };
    /*
     * @description Send a JSON String to client. 发送JSON数据到客户端
     * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
     */
    res.sendJSON = function (data) {
        async(function () {
            sendJSON(data, res);
        });
        return this;
    };
    /*
     * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
     * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
     */
    res.sendJSONP = function (data) {
        async(function () {
            sendJSONP(data, res);
        });
        return this;
    };
    /*
     * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
     * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
     */
    res.redirect = function (url) {
        async(function () {
            redirect(url, res, req);
        });
        return this;
    };
    /*
     * @description Set a cookies on the client. 在客户端设置cookies
     * @param {String} name name of the cookies.(require) cookies的名字*
     * @param {String} val content of the cookies.(require) cookies的数据*
     * @param {Object} options Detail options of the cookies. cookies的详细设置
     */
    res.setCookie = function (name, val, options) {
        async(function () {
            setCookie(name, val, options, res);
        });
        return this;
    };
    res.cookie = res.setCookie;
    /*
     * @decription Claer the specify cookies. 清除某指定cookies
     * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
     * @param {Object} options Detail options of the cookies. cookies的详细设置
     */
    res.clearCookie = function (name, options) {
        this.cookie(name, '', options);
        return this;
    };
    res.setHeader('Date', new Date().toUTCString());
    res.setHeader('Server', 'Node.js with webjs');
    res.setHeader('Accept-Ranges', 'bytes');
    cb();
}