var web = require('webjs');
var http = require('http');
var assert = require('assert');

var port = 45678;
var host = '127.0.0.1';
web.run(port)
    .get({
        '/test': function (req, res) {
            res.send('ok');
        }
    });

function getRequestHelper(path, method, callback) {
    var request = http.request({
            host: host,
            port: port,
            path: path,
            method: method,
     });
    request.on('response',function(response) {
        response.on('data', function (chunk) {
            console.log(chunk);
        });
    });
    request.end();
}

module.exports = {
    'test get': function(beforeExit){
        //action
        getRequestHelper('/test', 'get', function(chunk){
            console.log(chunk);
            assert.equal('querystring', chunk, 'The get method return value not match!');
            console.log('"test get" success!'); 
        });
        
        beforeExit(function(){web.stop();});
    },
    'test error':function(beforeExit){
        web.setErrorPage(404, __dirname + '404.html');  
        //action
        getRequestHelper('/notexistpage', 'get', function(chunk){
            assert.equal('404 page not found!', chunk, 'Check if return the 404 page content!');
            console.log('"test 404 error" success!');   
        });
        beforeExit(function(){web.stop();});    
    }
};