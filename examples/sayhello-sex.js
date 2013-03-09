var web = require('webjs');

var getRouter = {
  'name/:sex': function (req, res) {
    switch (req.query.sex) {
      case 'woman':
        res.send('Hi! Miss. ' + decodeURI(req.path[0]) + '! Nice to meet you.');
        break;
      case 'man':
      default:
        res.send('Hey! Mr. ' + decodeURI(req.path[0]) + '! Nice to meet you.');
    }
  }
};
web.run(8888)
  .use(web.query())
  .get(getRouter);