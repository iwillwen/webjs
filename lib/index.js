//Metas
var web = exports;
web.servers = [];
web.httpsServers = [];
require('./method').ext(web);
require('emitter')(web);

global.web = web;