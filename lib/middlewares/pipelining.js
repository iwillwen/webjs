/**
 * webjs - Response Pipeling Patch
 * Copyright(c) 2012 C61 Lab
 * MIT Licensed
 */

module.exports = function () {
    return function (req, res, next) {

        // add pipelining method support
        res.__defineGetter__('pipelining', function () {
            return function (callback) {
                this.on('pipelining', callback);
            }
        });

        // you also can call use
        res.__defineGetter__('use', function () {
            return this.pipelining;
        });

        next();
    }
};