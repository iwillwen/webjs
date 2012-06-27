/*!
 * webjs - Request and Response Patch
 * Copyright(c) 2012 C61 Lab
 * MIT Licensed
 */

var Request = require('../request');
var Response = require('../response');

module.exports = function () {
    return function (req, res, next) {
        var reqPatch = new Request(req);
        var resPatch = new Response(res);
        for (var method in reqPatch)
            req.__defineGetter__(method, function () {
                return reqPatch[method];
            });
        for (var method in resPatch)
            res.__defineGetter__(method, function () {
                return resPatch[method];
            });
        next();
    }
};