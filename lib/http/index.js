var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')
  , shoe = require('shoe')
  , Scheduler = require('../scheduler')
  , scheduler = new Scheduler({ process: function () {} })

module.exports = app

app.configure(function () {
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(app.router)
  app.set('views', __dirname + '/')
  app.set('view engine', 'jade')
})

app.get('/', function (req, res) {
  res.render('index')
})

// This blows, but I don't know how to get the server in a mounted app
var init = module.exports.init = function (server) {
  var sock = shoe(function (stream) {
     var iv = setInterval(function () {
        scheduler.schedule('-inf', '+inf', function (err, schedule) {
          stream.write(JSON.stringify(schedule))
        })
    }, 1000)

    stream.on('end', function () {
      clearInterval(iv)
    })
  })

  sock.install(server, '/redshed-schedule')
}
