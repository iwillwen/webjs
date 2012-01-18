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
utils.restParser = function (path, reg, reqPath, match) {
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
utils.merge = function (source, received) {
    var index;
    for (index in received) {
        if (typeof source[index] === "undefined") {
            source[index] = received[index];
        }
    }
    return source;
};