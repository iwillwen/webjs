var mimes = require('./mimes').mimes,
    session = require('./session');
module.exports = function (req, res) {
    /* 加入session支持 */
    /** 开启Session，执行后将可通过req.session来访问Session数据 */
    req.sessionStart = function () {
        session.start(req, res);
        return this;
    };
    /** 关闭Session，执行后删除Session数据 */
    req.sessionEnd = function () {
        session.end(req, res);
        return this;
    };
    //Request
    /*
     * @description Check the Request's MIME type is same to specify MIME type or not. 检测请求的MIME类型是否为指定的MIME类型
     * @param {String} type The MIME type to check.(require) 需要检测的MIME类型*
     */
    req.type = function(type) {
        var contentType = this.headers['content-type'];
        if (!contentType) return;
        if (!~type.indexOf('/')) type = mimes[type];
        if (~type.indexOf('*')) {
            type = type.split('/');
            contentType = contentType.split('/');
            if ('*' == type[0] && type[1] == contentType[1]) return true;
            if ('*' == type[1] && type[0] == contentType[0]) return true;
        }
        return !! ~contentType.indexOf(type);
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
}