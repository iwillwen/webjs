/*!
 * webjs - Request and Response Patch
 * Copyright(c) 2012 C61 Lab
 * MIT Licensed
 */

var Request = require('../request');
var Response = require('../response');

module.exports = function () {
  return function (req, res, next) {
    req = new Request(req);
    res = new Response(res);
    next();
  }
};