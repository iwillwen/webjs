var web = require('webjs');

web.run(8888)
    .get('/', function (req, res) {
        res.send('index');
    });