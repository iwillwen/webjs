//Metas
var web = exports;
web.version = '0.3.6';
web.mime = require('./mimes').mimes,
            web.metas = {},
            web.servers = [],
            web.httpsServers = [];
require('./method')(web);

global.web = web;