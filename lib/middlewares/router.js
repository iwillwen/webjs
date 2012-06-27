
/*!
 * webjs - Router
 * Copyright(c) 2011 C61 Lab
 * MIT Licensed
 */

var Request = require('../request');
var Response = require('../response');
var utils = require('../utils');
var url = require('url');

module.exports = function (_req, _res, out) {
    var server = global.web.server;
    var handlers = server.handlers;
    var rules = server.rules;

    global.web.emit(_req.method.toLowerCase(), _req, _res);
    var stack = [];
    var _rules = [];

    for (var key in rules[_req.method.toLowerCase()]) {
        if (rules[_req.method.toLowerCase()][key].test(url.parse(_req.url).pathname)) {
            stack.push(handlers[_req.method.toLowerCase()][key]);
            _rules.push({ key: key, rule: rules[_req.method.toLowerCase()][key] });
        }
    }

    if (stack.length > 0) {
        var req = new Request(_req);
        var res = new Response(_res);
    } else {
        return out();
    }

    var index = 0;

    function next () {

        // next callback
        var layer = stack[index++];

        // all done
        if (!layer || res.headerSent) {
            return out();
        }
        try {
            req.params = utils.restParser(_rules[index - 1].key, _rules[index - 1].rule, req.reqPath);
            layer(req, res, next);
        } catch (e) {
            next(e);
        }
    }

    next();
}