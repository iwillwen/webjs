var utils = require('../utils');
module.exports = function () {
    return function (req, res, next) {
        req.cookies = utils.unserializeCookie(req.headers.cookie) || {};
        next();
    };
};