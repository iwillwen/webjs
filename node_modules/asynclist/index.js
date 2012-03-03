var eventproxy = require('eventproxy').EventProxy;
function asyncList (list) {
    this.proxy = new eventproxy();
    this.list = list;
    this.length = list.length;
}
asyncList.prototype.trigger = function (value) {
    this.proxy.trigger('finished', value);
    return this;
};
asyncList.prototype.assign = function (callback) {
    this.handler = callback;
    return this;
};
asyncList.prototype.run = function (arg1, arg2, arg3) {
    var self = this;
    var list = this.list;
    if (this.length !== 0) {
        self.proxy.after('finished', this.length, function (triggers) {
            self.handler(triggers);
        });
    } else {
        self.handler([]);
    }
    list.forEach(function (task) {
        process.nextTick(function () {
            task(arg1, arg2, arg3);
        });
    });
};
asyncList.prototype.compile = function (mapper) {
    var lister = function (list) {
        this.list = list.map(mapper);
        this.length = list.length;
        this.proxy = new eventproxy();
    };
    lister.prototype.trigger = function (value) {
        this.proxy.trigger('finished', value);
        return this;
    };
    lister.prototype.assign = function (callback) {
        this.handler = callback;
        return this;
    };
    lister.prototype.run = function (arg1, arg2, arg3) {
        var self = this;
        var list = this.list;
        if (this.length !== 0) {
            self.proxy.after('finished', this.length, function (triggers) {
                self.handler(triggers);
            });
        } else {
            self.handler([]);
        }
        list.forEach(function (task) {
            process.nextTick(function () {
                task(arg1, arg2, arg3);
            });
        });
    };
    return lister;
};
module.exports = asyncList;