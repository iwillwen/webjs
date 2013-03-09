
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
  var errorHandler = (handlers.error ? handlers.error[0] : null);

  global.web.emit(_req.method.toLowerCase(), _req, _res);
  var hit = null;
  var _rule = null;

  for (var key in rules[_req.method.toLowerCase()]) {
    if (rules[_req.method.toLowerCase()][key].test(url.parse(_req.url).pathname)) {
      hit = handlers[_req.method.toLowerCase()][key];
      _rule = { key: key, rule: rules[_req.method.toLowerCase()][key] };
      break;
    }
  }

  if (hit) {
    var req = new Request(_req);
    var res = new Response(_res, _req);
  } else {
    return out();
  }
  try {
    req.params = utils.restParser(_rule.key, _rule.rule, req.reqPath);
    if (errorHandler) {
      hit(req, res, function (err) {
        errorHandler(err, req, res, out);
      });
    } else {
      hit(req, res, out);
    }
  } catch (e) {
    if (errorHandler) {
      errorHandler(e, req, res, out);
    } else {
      out(e);
    }
  }

}