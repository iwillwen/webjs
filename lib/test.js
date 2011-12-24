var Jscex = require("jscex-jit");
require("jscex-async").init(Jscex);
require("./jscex-async-powerpack").init(Jscex);
var req = {};
var jscexifyHandler = function (handler) {
    return function (req, res) {
        var delegate = {
            onStart: function (callback) {
                var next = function () {
                    callback('success')
                };
                handler(req, res, next);
            }
        };
        return new Jscex.Async.Task(delegate);
    }
};
var executeParallel = eval(Jscex.compile("async", function (userHandlers) {
    var jscexHandlers = userHandlers.map(jscexifyHandler);
    var tasks = jscexHandlers.map(function (handler, index) {
        return handler(req, {});
    });
    return $await(Jscex.Async.Task.whenAll(tasks));
}));
var handlers = [
	function (req, res, next) {
		req.a = '1';
		next();
	},
	function (req, res, next) {
		req.a = '1';
		next();
	},
	function (req, res, next) {
		req.a = '1';
		next();
	}
];
var executeEventAsync = function (eventName) {
    if (handlers.length === 0) {
        var delegate = {
                onStart: function (callback) {
                    callback("success");
                }
            };
        return new Jscex.Async.Task(delegate);
    };
    var tasks = executeParallel(handlers);
    return tasks;
};
var task = executeEventAsync(handlers);
task.addEventListener("success", function (ex) {
	console.log(req);
});
task.start();