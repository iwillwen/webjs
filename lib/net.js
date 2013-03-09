var net = require('net');
var sockets = [];
var util = require('util');
var utils = require('./utils');
  
module.exports = function (callback) {
  var tcpServer = net.createServer(function (socket) {
    socket.id = utils.hash('md5', Math.random().toString(32).substr(2));
    socket.on('connect', function () {
        socket.emit('connection');
    });
    socket.on('data', function (data) {
      socket.emit('message', data);
    });
    socket.on('end', function () { 
      var a = sockets.indexOf(socket);
      sockets.splice(a, 1);
      socket.emit('disconnect');
    });
    socket.send = function (str) {
      socket.write(str);
      return this;
    };
    socket.broadcast = function (data) {
      for (var i = 0; i < sockets.length; i++) {
        if (sockets[i] == socket) continue;
        sockets[i].write(data);
      }
      return this;
    };
    sockets.push(socket);
    callback(socket);
  });
  return tcpServer;
};