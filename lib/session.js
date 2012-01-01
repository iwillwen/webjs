/**
 * Session模块
 */
var url = require('url'); 
 
var session = module.exports;
// md5函数
var md5 = require('./md5');
/** SESSION标识符 */
session.SESSION_TAG = 'SESSIONID';
/** SESSION存活时间 */
session.MAX_AGE = 1800000; // 30分钟
/** SESSION回收周期 */
session.RECOVER = 60000;	// 1分钟
/** 存放session容器 */
session.sessions = {}
/**
 * 根据session id获取Session
 *
 * @param {string} session_id
 * @return {object}
 */
session.get = function (session_id) {
	if (session_id in session.sessions)
		return session.sessions[session_id].data;
	else
		return false;
}
/**
 * 删除指定session id
 *
 * @param {string} session_id
 */
session.del = function (session_id) {
	if (session_id in session.sessions)
		delete session.sessions[session_id];
}
/**
 * 开启Session
 *
 * @param {http.ServerRequest} req
 * @param {http.ServerResponse} res
 */
session.start = function (req, res) {
	// 获取session id
	var get = url.parse(req.url, true).query;
	// 优先采用通过GET提交的session id
	if (typeof get[session.SESSION_TAG] == 'string' && get[session.SESSION_TAG] != '')
		var session_id = get[session.SESSION_TAG];
	else {
		// 如果Cookie存在已有的session id，则优先使用
		if (typeof req.cookies[session.SESSION_TAG] == 'string')
			var session_id = req.cookies[session.SESSION_TAG];
		// 否则，创建一个新的Session id
		else
			var session_id = md5(new Date().getTime() + '' + Math.random());
		// 如果是通过cookie设置的session id，则需要更新cookie的存活期限
		res.setCookie(session.SESSION_TAG, session_id, {maxAge: session.MAX_AGE});
	}
	
	// 根据 session id获取对应的数据
	var s = session.get(session_id);
	// 如果session不存在，则先创建
	if (s == false)
		s = session.add(session_id);
		
	// 更新时间戳
	session.hold(session_id);
	
	// 设置保存到req.session中
	req.session = s;					// session数据
	req.session_id = session_id;		// session id，供session.end()使用
}
/**
 * 关闭session
 *
 * @param {http.ServerRequest} req
 * @param {http.ServerResponse} res
 */
session.end = function (req, res) {
	var session_id = req.session_id;
	
	// 删除内存中的session
	session.del(session_id);
	
	// 清除cookie
	res.clearCookie(session.SESSION_TAG);
}
/**
 * 创建一个session
 *
 * @param {string} session_id
 */
session.add = function (session_id) {
	var s = {
		data:		{},		// session数据
		timestamp:	0		// 时间戳
	}
	session.sessions[session_id] = s;
	return session.sessions[session_id].data;
}
/**
 * 更新时间戳
 *
 * @param {string} session_id
 */
session.hold = function (session_id) {
	if (session_id in session.sessions)
		session.sessions[session_id].timestamp = new Date().getTime();
}
/** session回收 */
setInterval(function () {
	var timestamp = new Date().getTime();
	for (var i in session.sessions)
		if (session.sessions[i].timestamp + session.MAX_AGE < timestamp)
			delete session.sessions[i];
}, session.RECOVER);