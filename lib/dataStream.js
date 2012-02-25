var Stream = require('stream').Stream;
var bufferhelper = require('bufferhelper');
var util = require('util');

function dataStream () {
    var self = this;
    self.writable = true;
    self.readable = true;
    self.buffer = new bufferhelper();
}
util.inherits(dataStream, Stream);
dataStream.prototype.ok = function () {
    var data = this.buffer.toBuffer();
    this.empty();
    this.emit('data', data);
    this.emit('end');
    return this;
};
dataStream.prototype.write = function (chunk) {
    if (typeof chunk == 'string') {
        var buffer = new Buffer(chunk);
        chunk = buffer;
    }
    this.buffer.concat(chunk);
    this.emit('data', chunk);
    return this;
};
dataStream.prototype.empty = function () {
    this.buffer = new bufferhelper();
    return this;
};
dataStream.prototype.end = function () {
    this.emit('complate');
    this.emit('end');
};
dataStream.prototype.out = function () {
    return this.buffer.toBuffer();
};
module.exports = dataStream;