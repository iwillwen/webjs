var hex_md5 = function (string) {
		var md5 = require('crypto').createHash('md5');
		return md5.update(string).digest('hex');
	};
module.exports = hex_md5;