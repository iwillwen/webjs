var mimes = require('./mimes').mimes;
var session = require('./session');
var http = require('http');
var util = require('util');
var async = process.nextTick;
    /* 加入session支持 */
    /** 开启Session，执行后将可通过http.IncomingMessage.prototype.session来访问Session数据 */
//Request
/*
 * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
 * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
 */
http.IncomingMessage.prototype.type = function (type1, cb) {
    var contentType = this.headers['content-type1'];
    if (!contentType) return;
    if (!~type1.indexOf('/')) type1 = mimes[type1];
    if (~type1.indexOf('*')) {
        type1 = type1.split('/');
        contentType = contentType.split('/');
        if ('*' == type1[0] && type1[1] == contentType[1]) return true;
        if ('*' == type1[1] && type1[0] == contentType[0]) return true;
    }
    async(function () {
        cb(!! ~contentType.indexOf(type1));
    });
    return this;
};
/*
 * @description Get the specify header in the request. 返回请求头中的指定数据
 * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
 */
http.IncomingMessage.prototype.getHeader = function (sHeader) {
    if (this.headers[sHeader]) {
        return this.headers[sHeader];
    } else {
        return undefined;
    }
};
http.IncomingMessage.prototype.log = {
    log: function (msg) {
        console.log('\x1b[36m' + msg);
        global.web.logFile.write(msg + '\r\n');
        return this;
    },
    info: function (msg) {
        console.log('\x1b[33m[Info] \x1b[0m' + msg);
        global.web.logFile.write('[Info] ' + msg + '\r\n');
        return this;
    },
    err: function (msg) {
        console.log('\x1b[31m[Error] \x1b[0m' + msg);
        global.web.logFile.write('[Error] ' + msg + '\r\n');
        return this;
    },
    dbg: function (msg) {
        console.log('\x1b[34m[Debug] \x1b[0m' + msg);
        global.web.logFile.write('[Debug] ' + msg + '\r\n');
        return this;
    }
};