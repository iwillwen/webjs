# webjs: Simple HTTP / TCP development framework.

For detailed information about this, please visit the [webjs homepage](http://webjs.im1996.com). 如果想获得详细的关于webjs的信息，请浏览[官方网站](http://webjs.im1996.com)。

[![Build Status](https://travis-ci.org/iwillwen/webjs.png?branch=master)](https://travis-ci.org/iwillwen/webjs)

# Install
    $ npm install webjs

or


    $ npm install webjs@latest

# App Demo
    $ webjs -h

    $ webjs init --all
 
# Quick Start

    var web = require('webjs');

    var urlRouter = {                   //Url Router(inclube file and 302 jump) URL路由功能(包括文件映射和域名跳转)
      '/:id.html' : 'page.html', //Return the 'page.html' data. 返回 'page.html' 的数据。(支持正则表达式)
      '/google' : 'http://www.google.com' //When the path name is 'google', the browser will redirect to Google homepage.  当访问/google时，浏览器自动跳转到Google首页。
    };
    var getRouter = {                   //Get Method Router and handler GET方法服务器响应
      '/getsomething' : function (req, res) {
        for (var key in req.qs) {
          res.send(key + ' : ' + req.qs[key], true);      //res.send 方法接受两个参数，第一个是需要传输的数据，第二个是确定是否保持通讯不中断，以供继续传输。
        }
        res.send('That all');
      }
    };
    var postRouter = {
      '/postsomething' : function (req, res) {   //Post Method Router and handler POST方法服务器响应
        res.send('Post success<br />' + JSON.stringify(req.data));
      }
    };
    web.run()  //Run the first http server 启动首个服务器
      .url(urlRouter) //Set the url router 传入URL映射规则
      .get(getRouter) //Set the get method router 传入GET方法规则
      .post(postRouter)  //Set the post method router 传入POST方法规则
      .use(web.bodyParser()); //Use the Body Parser

# Simple Deployment 简单化部署

如果你只想在某个文件夹内建立一个简单的文件服务器，那是非常简单的。 If you only want to deploy a simple file server, that's very easy!


    var web = require('webjs').run();
    web.use(web.static(__dirname));

or


    var app = require('webjs').create('http').listen();
    app.use(app.bodyParser());

Yes! It's so cool!
没错的，就是这么简单。

# Url Router URL路由映射

## Web.js supports a Url Router which is very easy to use. Web.js提供了十分简单的URL路由映射方法


    var web = require('webjs');

    var urlRouter = {
      '/:year/:mouth/:day/:id.jpg' : '$1-$2-$3-$4.jpg',  // YYYY/MM/DD/NUM.jpg -> YYYY-MM-DD-NUM.jpg
      '/:action' : 'main.html?action=$1'                // /get -> main.html?action=get
    };
    web.run(8888)
      .url(urlRouter);

# HTTP Mothod HTTP方法

## GET

    var web = require('webjs');

    var getRouter = {
      '/getQuerystring' : function (req, res) {            //Set two arguments, they're request and response. 传入两个参数，分别为Request, Response
        res.sendJSON(req.qs);           //The first argument can be an Array, an Object or a String. res.sendJSON()方法可以直接传入Array, Object, String的JSON对象
      },
      '/getQueryURL' : function (req, res) {
        res.send(req.url);          //The first argument must be a String. res.send()方法可以只能传入String数据
      },
      '/getFile' : function (req, res) {
        res.sendFile(req.qs.file);          //The first argument must be a file path.(it needn't begins with './') res.sendFile()方法只能传入含有文件名的String对象，不需要'./'
      }
    };

    web.run(8888)                               //Set a empty url router. 传入空URL路由规则
      .get(getRouter);                            //Set the get router. 传入GET方法规则

## POST


    var web = require('webjs');

    var postRouter = {
      '/postHello' : function (req, res) {           //The post router is same to the get router. 与GET方法规则相同
        res.send('Hello ' + req.data.name + '!');
      }
    };

    web.run(8888)
      .post(postRouter)                          //Set the post router. 传入POST方法规则
      .use(web.bodyParser());

## 其他HTTP方法

The others http method's usages are same to get router.


    var web = require('webjs');

    var putRouter = {
      '/putHello' : function (req, res) {
        res.send('Hello ' + req.data.name + '!');
      }
    };

    web.run(8888)
      .put(postRouter)
      .use(web.bodyParser());


## HTTPS

Https's usage is same to http's.
HTTPS方法与HTTP方法相同


    var web = require('webjs');
    var urlRouter = {
      '/:id.html' : 'page.html',
      '/google' : 'http://www.google.com'
    };
    var getRouter = {
      '/getQuerystring' : function (req, res) {
        res.sendJSON(req.qs);
      },
      '/getQueryURL' : function (req, res) {
        res.send(req.url);
      },
      '/getFile' : function (req, res) {
        res.sendFile(req.qs.file);  
      }
    };
    var postRouter = {
      '/postHello' : function (req, res) {
        res.send('Hello ' + req.data.name + '!');
      }
    };
    web.runHttps(8888)
      .url(urlRouter)
      .get(getRouter)
      .post(postRouter);

## Response Pipelining

通过Response Pipelining，你可以对即将发送至客户端的数据进行处理，如压缩、解析等等。
You can use this to edit the data will be sent to the client. Such as compress, compile.

    var web = require('webjs');
    var zlib = require('zlib');
    web.run()
      .use(
        web.static(__dirname + '/static'),
        function (req, res, next) {

          // collect data

          res.__defineGetter__('data', function () {
            return function (data) {
              this.data = data;
            }
          })

          // Working
          res.on('pipelining', function () {
            switch (this.data.type) {
              case "one":
              // do something
            }
          });

          next();
        }
      );

## 404 Page

    web.setErrorPage(404, __dirname + '/404.html');                             //Set a file path. 传入一个文件名


## Middleware 中间件

Web.js supports the middleware.
支持中间件，支持express和connect所有的中间件。


    var web = require('webjs');

    web.run()
      .use(
        web.bodyParser(),
        web.cookieParser('webjs'),
        web.session(),
        web.compress(),
        web.complier({ enable: ["less", "sass"] }),
        web.static(__dirname + '/static')
      );


# webjs plugin

Web.js supports a very cool plugin mechanism.

## Modular functions

You can use it to modular your app functions.


    module.exports = function (web) {
      web.get({
        '/some': function (req, res) {
          res.send('some');
        }
      });
    }

## Custom functions


    module.exports = function (web) {
      web.__defineGetter__('foo', function () {
        return this.servers;
      });

      // or
      web.fn('bar', funtion () {
        // do something
      });
    }
    
    
# License 

    (The MIT License)
    
    Copyright (c) 2010-2013 Will Wen Gunn (甘超阳) <willwengunn@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    'Software'), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.