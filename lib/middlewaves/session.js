var session = require('../session');
module.exports = function (opt) {
    return function (req, res, next) {
        session.start(req, res, opt);
        next();
    };
}