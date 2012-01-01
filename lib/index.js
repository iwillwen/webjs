//Metas
var web = exports;
web.metas = {};
web.servers = [];
web.httpsServers = [];
require('./method').ext(web);
require('emitter')(web);

global.web = web;