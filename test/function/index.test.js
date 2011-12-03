var web = require('index.js');
var http = require('http');
var assert = require('assert');

var port = 45678;
var host = '127.0.0.1';
web.run({},port);

function getRequestHelper(path, method, callback)
{
	var request = http.request({
            host: host,
            port: port,
            path: path,
            method: method,
     });
	request.on('response',function(response){
		response.on('data', callback);
	});
	request.end();
}

module.exports = {
    'foo()': function(beforeExit){
    },
  	'test get': function(beforeExit){
		//arrange
		var router = {
			'getQuerystring' : function (req, res) {
		    	res.sendJSON('querystring');
			}
		};
		web.get(router);
		
		//action
		getRequestHelper('/getQuerystring', 'get', function(chunk){
			assert.equal('querystring', chunk, 'The get method return value not match!');
			console.log('"test get" success!');	
		});
		
		beforeExit(function(){web.stop();});
  	},
	'test 404 error':function(beforeExit){
		web.set404('404.html');  
		//action
		getRequestHelper('/notexistpage', 'get', function(chunk){
			assert.equal('404 page not found!', chunk, 'Check if return the 404 page content!');
			console.log('"test 404 error" success!');	
		});
		beforeExit(function(){web.stop();});	
	}
};