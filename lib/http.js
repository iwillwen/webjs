/*
 * @class HTTP exports
 */
var http = require('http');
var method = require('./method');
/*
 * @function Create a HTTPS Server
 */
exports.createHttpServer = function (opt) {
    var currentServer = http.createServer();
    currentServer.setMaxListeners(0);
    method.ext(currentServer);
    return currentServer;
};