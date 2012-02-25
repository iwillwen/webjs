var web = require('webjs');
var getRouter = {
	'add/:a/:b': function (req, res) {
		res.send(Number(req.path.a) + Number(req.path.b) + '');
	},
	'sub/:a/:b': function (req, res) {
		res.send(Number(req.path.a) - Number(req.path.b) + '');
	},
	'mul/:a/:b': function (req, res) {
		res.send(Number(req.path.a) * Number(req.path.b) + '');
	},
	'div/:a/:b': function (req, res) {
		res.send(Number(req.path.a) / Number(req.path.b) + '');
	},
	'/:path/:path/:id': function (req, res) {
		res.send(req.path.id);
	}
};
web.run({'js/:math': '$1.js'}, 8888)
	.get(getRouter);
console.log('running');