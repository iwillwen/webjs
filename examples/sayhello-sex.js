var web = require('webjs');

var getRouter = {
	'name\/(.*)': function (req, res) {
		switch (qs.sex) {
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
	.get(getRouter);