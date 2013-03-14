var web = require('webjs');
var assert = require('assert');
module.exports = {
    test1: function () {
    },
	'web.post':function(){
		//arrange
		this.server = {postHandlers:{}};
		var _postHandlers = {'f1':function(){console.log('function1');},'f2':function(){console.log('function2');}};
		
		//action
		web.post(_postHandlers, this.server);

		//assert
		assert.equal(this.server.postHandlers.length, _postHandlers.length, 'server.postHandlers not match!');
		assert.equal(this.server.postHandlers[0],_postHandlers[0]);
		assert.equal(this.server.postHandlers[1],_postHandlers[1]);
		
		//clean
		this.server = null;
	}
};