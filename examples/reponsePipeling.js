var web = require('webjs');

// Custom stream class
var dataStream = require('dataStream');

web.run(8888)
    .use(web.cookieParser('webjs'))
    .use(web.session())

    // Response Pipelining
    .use(web.complier({ enable: ["less"] }))
    .use(function (req, res, next) {

        var render = function (body) {
            // do something
        };
        var complieStream = new dataStream({ readable: false });

        complieStream.on('complete', function () {
            var body = this.body()/* Buffer */
                        .toString();

            // empty the stream
            this.empty();

            // pipe data to the next stream
            this.emit('data', render(body));
        });

        res.pipelining(function () {
            return complieStream;
        });

        next();
    })
    .use(web.compress())
    .use(function (req, res, next) {

        // collect data

        res.__defineGetter__('data', function () {
            return function (data) {
                this.data = data;
            }
        })

        // Working
        res.pipelining(function () {
            switch (this.data.type) {
                case "one":
                // do something
            }
        });

        next();
    })
    .use(web.static(__dirname + '/../static'));

    /**
     * 
     * Pipeline
     * Static -> Complier -> Custom Complier -> Compress -> Data Mining -> Response
     * 
     */

console.log('The app is running!');