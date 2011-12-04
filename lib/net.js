var net = require('net'),
    events = require('events'),
    sockets = [],
    util = require('util');
    
exports.net = function (port, callback) {
    var tcpServer = net.createServer(function (socket) {
        util.inherits(socket, events.EventEmitter);
        socket.id = Math.round(Math.random() * 10000000000);
        socket.on('connect', function () {
            for (var i = 0; i < socket.listeners('connection').length; i++) {
                socket.listeners('connection')[i]();
            }
        });
        socket.on('data', function (data) {
            for (var i = 0; i < socket.listeners('message').length; i++) {
                socket.listeners('message')[i](data);
            }
        });
        socket.on('end', function () { 
            var a = sockets.indexOf(socket);
            sockets.splice(a, 1);
            for (var i = 0; i < socket.listeners('disconnect').length; i++) {
                socket.listeners('disconnect')[i]();
            }
        });
        socket.send = function (str) {
            socket.write(str);
        };
        socket.broadcast = function (data) {
            for (var i = 0; i < sockets.length; i++) {
                if (sockets[i] == socket) continue;
                sockets[i].write(data);
            }
        };
        sockets.push(socket);
        callback(socket);
    }).listen(port);
    return tcpServer;
};