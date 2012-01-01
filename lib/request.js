var mimes = require('./mimes').mimes,
    session = require('./session'),
    async = process.nextTick;
function sessionStart (req, res) {
    session.start(req, res);
}
function sessionEnd (req, res) {
    session.end(req, res);
}
function type (type1, cb) {
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
}
module.exports = function (req, res, cb) {
    /* 加入session支持 */
    /** 开启Session，执行后将可通过req.session来访问Session数据 */
    req.sessionStart = function () {
        async(function () {
            sessionStart(req, res);
        });
        return this;
    };
    /** 关闭Session，执行后删除Session数据 */
    req.sessionEnd = function () {
        async(function () {
            sessionEnd(req, res);
        });
        return this;
    };
    //Request
    /*
     * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
     * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
     */
    req.type = function (type1, cb) {
        async(function () {
            type(type1, cb)
        });
        return this;
    };
    /*
     * @description Get the specify header in the request. 返回请求头中的指定数据
     * @param {String} sHeader Name of the header to get.(require) 需要查询的头数据名*
     */
    req.getHeader = function (sHeader) {
        if (this.headers[sHeader]) {
            return this.headers[sHeader];
        } else {
            return undefined;
        }
    };
    cb();
}