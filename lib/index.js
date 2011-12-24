//Metas
var web = exports;
web.metas = {};
web.servers = [];
web.httpsServers = [];
require('./method')(web);

global.web = web;