//Metas
var web = exports;
web.servers = [];
web.httpsServers = [];
require('./method').ext(web);
require('emitter')(web);

global.__defineGetter__('web', function () {
  return web;
});
global.__defineSetter__('web', function (_web) {
  web = _web;
});