var utils = module.exports;

/**
 * 序列化Cookie
 *
 * @param {string} name Cookie名称
 * @param {string} val Cookie值
 * @param {object} options 选项，包括 path, expires, domain, secure
 * @return {string}
 */
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

/**
 * 反序列Cookie
 *
 * @param {string} cookies Cookie字符串
 * @return {object}
 */
utils.unserializeCookie = function (cookies) {
	if (!cookies)
		return {}
	var cookieline = cookies.toString().split(';');
	var ret = {};
	for (i in cookieline) {
		var line = cookieline[i].trim().split('=');
		if (line.length > 1) {
			var k = line[0].trim();
			var v = unescape(line[1].trim());
			ret[k] = v;
		}
	}
	return ret;
}
 

// Extend a given object with all the properties in passed-in object(s).
utils.merge = function (source, received) {
	var index;
	for (index in received) {
		if (typeof source[index] === "undefined") {
			source[index] = received[index];
		}
	}
	return source;
};