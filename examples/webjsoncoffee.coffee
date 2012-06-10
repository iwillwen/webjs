web = require 'webjs'

web.run(8888)
   .config(
      'views': __dirname + '/../views'
      'view engine': 'jade'
      'mode': 'dev'
   )
   .use(web.complier enable: ["less"])
   .use(do web.compress)
   .use '/public', web.static __dirname + '/..'


web.get
    '/hello': (req, res) ->
        res.send 'Hello Green World!'
    '/sayName': (req, res) ->
        res.send 'I\'m the World!'

console.log 'The app is runing!'