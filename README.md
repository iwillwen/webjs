# Web.js: Simple HTTP / TCP development framework. #

For detailed information about this, please visit the [Web.js homepage]. 如果想获得详细的关于Web.js的信息，请浏览官方网页。

# Install #
```
$ npm install webjs
```
# Quick Start #
```javascript
var web = require('webjs');

var urlRouter = {                   //Url Router(inclube file and 302 jump) URL路由功能(包括文件映射和域名跳转)
        '^(.*)' : 'page.html', //Return the 'page.html' data. 返回 'page.html' 的数据。(支持正则表达式)
        '^google' : 'http://www.google.com' //When the path name is 'google', the browser will redirect to Google homepage.  当访问/google时，浏览器自动跳转到Google首页。
        },
    getRouter = {                   //Get Method Router and handler GET方法服务器响应
        'getsomething' : function (req, res) {
                    for (var key in req.qs) {
                        res.send(key + ' : ' + req.qs[key], true);      //res.send 方法接受两个参数，第一个是需要传输的数据，第二个是确定是否保持通讯不中断，以供继续传输。
                    }
                    res.send('That all');
                }
        },
    postRouter = {
        'postsomething' : function (req, res) {   //Post Method Router and handler POST方法服务器响应
                    res.send('Post success<br />' + JSON.stringify(req.data));
                }
        };
web.run(urlRouter, 80)  //Run the first http server 启动首个服务器，并传入传入URL映射规则
    .get(getRouter) //Set the get method router 传入GET方法规则
    .post(postRouter);  //Set the post method router传入POST方法规则
```
# Simple Deployment 简单化部署 #

如果你只想在某个文件夹内建立一个简单的文件服务器，那是非常简单的。 If you only want to deploy a simple file server, that's very easy!

```javascript
require('webjs').run()
```

or

```javascript
require('webjs').create('http').listen();
```

Yes! It's so cool!
没错的，就是这么简单。

# Url Router URL路由映射 #

## Web.js supports a Url Router which is very easy to use. Web.js提供了十分简单的URL路由映射方法  ##

```javascript
var web = require('webjs');

var urlRouter = {
        '\:year\:mouth\:day\:id.jpg' : '$1-$2-$3-$4.jpg',  // YYYY/MM/DD/NUM.jpg -> YYYY-MM-DD-NUM.jpg
        '\:action' : 'main.html?action=$1'                // /get -> main.html?action=get
        };
web.run(urlRouter, 8888);
```
# HTTP Mothod HTTP方法 #

## GET ##
```javascript
var web = require('webjs');

var getRouter = {
        'getQuerystring' : function (req, res) {            //Set two arguments, they're request and response. 传入两个参数，分别为Request, Response
                    res.sendJSON(req.qs);           //The first argument can be an Array, an Object or a String. res.sendJSON()方法可以直接传入Array, Object, String的JSON对象
                },
        'getQueryURL' : function (req, res) {
                    res.send(req.url);          //The first argument must be a String. res.send()方法可以只能传入String数据
                },
        'getFile' : function (req, res) {
                    res.sendFile(req.qs.file);          //The first argument must be a file path.(it needn't begins with './') res.sendFile()方法只能传入含有文件名的String对象，不需要'./'
                }
        };

web.run({}, 8888)                               //Set a empty url router. 传入空URL路由规则
    .get(getRouter);                            //Set the get router. 传入GET方法规则
```
## POST ##

```javascript
var web = require('webjs');

var postRouter = {
        'postHello' : function (req, res) {           //The post router is same to the get router. 与GET方法规则相同
                    res.send('Hello ' + req.data.name + '!');
                }
        };

web.run({}, 8888)
    .post(postRouter);                          //Set the post router. 传入POST方法规则
```

## 其他HTTP方法 ##

The others http method's usages are same to get router.

```javascript
var web = require('webjs');

var putRouter = {
        'putHello' : function (req, res) {
                    res.send('Hello ' + req.data.name + '!');
                }
        };

web.run({}, 8888)
    .put(postRouter);
```

## HTTPS ##

Https's usage is same to http's.
HTTPS方法与HTTP方法相同

```javascript
var web = require('webjs');
var urlRouter = {
        '^(.*)' : 'page.html',
        '^google' : 'http://www.google.com'
        },
    getRouter = {
        'getQuerystring' : function (req, res) {
                    res.sendJSON(req.qs);
                },
        'getQueryURL' : function (req, res) {
                    res.send(req.url);
                },
        'getFile' : function (req, res) {
                    res.sendFile(req.qs.file);  
                }
        },
    postRouter = {
        'postHello' : function (req, res) {
                    res.send('Hello ' + req.data.name + '!');
                }
        };
web.runHttps(urlRouter, 8888)
    .get(getRouter)
    .post(postRouter);
```

## 404 Page ##
```javascript
web.set404('./404.html');                             //Set a file path. 传入一个文件名
```
## noMimes ##
Block some get request which gets some file with specified extname. 禁止某些文件类型

```javascript
var noMimes = {
        'php' : function (req, res){
                res.send('You can`t request any PHP files');
            },
        'exe' : function (req, res){
                res.send('You can`t request any EXE files');
            },
        'sh' : function (req, res){
                res.send('You can`t request any SH files');
            }
        };
web.noMimes(noMimes);
```
## Custom MIME type 自定义 MIME 类型 ##


```javascript
web.reg('ext', 'image/ext');
```

## Middleware 中间件 ##

Web.js supports the middleware.
支持中间件，支持express和connect所有的中间件。

```javascript
var stylus = require('stylus');
web.use(stylus.middleware({
        src: __dirname + '/views',
        dest: __dirname + '/public',
        compile: compile
}));
```

or

```javascript
var app = require('webjs').create(),
    stylus = require('stylus');
app.use(stylus.middleware({
        src: __dirname + '/views',
        dest: __dirname + '/public',
        compile: compile
})).listen(8888);
```

# webjs plugin #

Web.js supports a very cool plugin mechanism.

## Modular functions ##

You can use it to modular your app functions.

```javascript
module.exports = function (web) {
    web.get({
        'some': function (req, res) {
            res.send('some');
        }
    })
}
```

## Custom functions ##

```javascript
module.exports = function (web) {
    web.foo = function () {
        
    }
}
```