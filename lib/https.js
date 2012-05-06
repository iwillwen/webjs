/*
 * @class HTTPS exports
 */
var https = require('https');
var method = require('./method');
/*
 * @function Create a HTTPS Server
 */
exports.createHttpsServer = function (opt) {
    var currentServer = https.createServer();
    currentServer.setMaxListeners(0);
    method.ext(currentServer);
    return currentServer;
};