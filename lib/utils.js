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