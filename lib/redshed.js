var scheduler = require('./scheduler')

module.exports = scheduler

module.exports.app

var app

Object.defineProperty(module.exports, 'app', {
  get: function() {
    return app || (app = require('./http'))
  }
})
