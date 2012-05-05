var utils = module.exports;
utils.serializeCookie = function (name, val, options) {
    var ret = name + '=' + escape(val) + ';';
    if (options.path)
        ret += ' path=' + options.path + ';';
    if (options.expires)
        ret += ' expires=' + options.expires.toGMTString() + ';';
    if (options.domain)
        ret += ' domain=' + options.domain + ';';
    if (options.secure)
        ret += ' secure';
    return ret;
};
var hash = require('crypto').createHash;
utils.hash = function (algorithm, str) {
    var hashEngine = hash(algorithm);
    hashEngine.update(str);
    return hashEngine.digest('hex');
};
utils.parseRange = function (str, size) {
    if (str.indexOf(",") != -1) {
        return;
    }
    var range = str.split("-");
    var start = range[0].replace('bytes=', '');
    start = parseInt(start, 10);
    var end = parseInt(range[1], 10);
    // Case: -100
    if (isNaN(start)) {
        start = size - end;
        end = size - 1;
    // Case: 100-
    } else if (isNaN(end)) {
        end = size - 1;
    }
    if (isNaN(start) || isNaN(end) || start > end || end > size) {
        return;
    }
    return {start: start, end: end};
};
utils.restParser = function (path, reg, reqPath) {
    var args = [];
    while (/:([a-zA-Z0-9-_.$]*)/g.test(path)) {
        path = path.replace(/:([a-zA-Z0-9-_.$]*)/i, ':(.*)');
        args.push(RegExp['$1']);
        path = path.replace(/\/:\(\.\*\)/i, '\\/(.*)')
                    .replace(/\(:\(\.\*\)\)/i, '(.*)');
    }
    reg.test(reqPath);
    var $args = {};
    for (var i = 0; i < 10; i++)
        if (RegExp['$' + i] !== '')
            $args[args[i - 1]] = RegExp['$' + i];
        else break;
    return $args;
};
utils.unserializeCookie = function (cookies) {
    if (!cookies)
        return {};
    var cookieline = cookies.split(';');
    var ret = {};
    for (var i = 0; i < cookieline.length; i++) {
        var line = cookieline[i].trim().split('=');
        if (line.length > 1) {
            var k = line[0].trim();
            var v = unescape(line[1].trim());
            ret[k] = v;
        }
    }
    return ret;
};
utils.merge = function (a, b) {
    if (a && b) for (var key in b) a[key] = b[key];
};
utils.mergeAttrs = function (a, b) {
    if (a && b) for (var key in b) a.__defineGetter__(key, function () { return a[key]; });
};