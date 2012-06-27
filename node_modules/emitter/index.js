var asynclist = require('asynclist'),
    async = process.nextTick,
    util = require('util'),
    emitter_obejct = {
        _eventListeners: {},
        thenHandler: {},
        on: function (event, handler) {
            var self = this;
            async(function () {
                if (self._eventListeners[event] == undefined) {
                    self._eventListeners[event] = [handler];
                } else {
                    self._eventListeners[event].push(handler);
                }
            });
            return this;
        },
        addListener: function (event, handler) {
            var self = this;
            async(function () {
                if (self._eventListeners[event] == undefined) {
                    self._eventListeners[event] = [handler];
                } else {
                    self._eventListeners[event].push(handler);
                }
            });
            return this;
        },
        once: function (event, handler) {
            var self = this;
            async(function () {
                var g = function () {
                    handler();
                    self.removeListner(event, g);
                };
                self.on(event, g);
            });
            return this;
        },
        removeListener: function (event, handler) {
            var self = this;
            async(function () {
                var index = self._eventListeners[event].indexOf(handler);
                self._eventListeners[event].splice(index, 1);
            });
            return this;
        },
        removeAllListener: function (event) {
            var self = this;
            async(function () {
                self._eventListeners[event] = [];
            });
            return this;
        },
        emit: function (event, arg1, arg2, arg3, arg4, arg5) {
            var self = this;
            async(function () {
                var then = self.thenHandler[event] ? self.thenHandler[event] : function () {},
                    handlers = self._eventListeners[event] !== undefined ? self._eventListeners[event] : [];
                var tasks = new asynclist(handlers);
                tasks.assign(then).run(arg1, arg2, arg3, arg4, arg5);
            });
            return this;
        },
        then: function (event, cb) {
            this.thenHandler[event] = cb;
            return this;
        },
        listeners: function (event) {
            if (this._eventListeners[event] !== undefined) {
                return this._eventListeners[event];
            } else {
                return [];
            }
        }
    },
    emitter_class = function () {};
emitter_class.prototype._eventListeners = [];
emitter_class.prototype.on = function (event, handler) {
    var self = this;
    async(function () {
        if (self._eventListeners[event] == undefined) {
            self._eventListeners[event] = [handler];
        } else {
            self._eventListeners[event].push(handler);
        }
    });
    return this;
};
emitter_class.prototype.once = function (event, handler) {
    var self = this;
    async(function () {
        if (self._eventListeners[event] == undefined) {
            self._eventListeners[event] = [handler];
        } else {
            self._eventListeners[event].push(handler);
        }
    });
    return this;
};
emitter_class.prototype.addListener = function (event, handler) {
    var self = this;
    async(function () {
        if (self._eventListeners[event] == undefined) {
            self._eventListeners[event] = [handler];
        } else {
            self._eventListeners[event].push(handler);
        }
    });
    return this;
};
emitter_class.prototype.removeListener = function (event, handler) {
    var self = this;
    async(function () {
        var index = self._eventListeners[event].indexOf(handler);
        self._eventListeners[event].splice(index, 1);
    });
    return this;
};
emitter_class.prototype.removeAllListener = function (event) {
    var self = this;
    async(function () {
        self._eventListeners[event] = [];
    });
    return this;
};
emitter_class.prototype.emit = function (event, arg1, arg2, arg3, arg4, arg5) {
    var self = this;
    async(function () {
        var tasks = new asynclist(self._eventListeners[event]),
            handler = self.thenHandler ? self.thenHandler : function () {};
        tasks.assgin(handler).run(arg1, arg2, arg3, arg4, arg5);
        handler = function () {};
    });
    return this;
};
emitter_class.prototype.then = function (cb) {
    this.thenHandler = cb;
    return this;
};
module.exports = function (item) {
    switch (typeof item) {
        case "function": 
            util.inherits(item, emitter_class);
            break;
        case "object":
            for (var method in emitter_obejct) item[method] = emitter_obejct[method];
            break;
    };
    return this;
};