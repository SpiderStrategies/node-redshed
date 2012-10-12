var redis = require('redis')
  , next = require('./next')
  , moment = require('moment')
  , noop = function () {}

var Scheduler = function (opts) {
  if (!opts) {
    throw new Error('Must pass options')
  }
  if (!opts.process) {
    throw new Error('Must pass process callback')
  }

  this.client = redis.createClient()
  this.prefix = (opts.prefix || 'rs') + ':'
  this.bucket = (this.prefix) + (opts.bucket || 'set')
  this.processor = opts.process
  this.identifier = opts.identifier || '_id'
  this.interval = opts.poll || 750
  this._init()
}

module.exports = Scheduler

Scheduler.fn = Scheduler.prototype

Scheduler.fn._init = function () {
  setInterval(this.poll.bind(this), this.interval)
}

Scheduler.fn.add = function (item, cb) {
  var self = this
    , when = next(item.frequency)
    , args = [this.bucket, when, item[this.identifier]]
    , cb = cb || noop

  this.client.get(this.prefix + item[this.identifier], function (err, i) {
    if (i) { return cb(err, null) }

    self.client.multi()
      .zadd(args)
      .set(self.prefix + item[self.identifier], JSON.stringify(item))
      .exec(function (err, replies) {
        cb(err, replies)
      })
  })
}

Scheduler.fn.remove = function (id, cb) {
  this.client.multi()
    .del(this.prefix + id)
    .zrem([this.bucket, id])
    .exec(cb || noop)
}

Scheduler.fn.poll = function () {
  var self = this
    , args = [this.bucket, moment().unix(), '-inf']

  this.client.zrevrangebyscore(args, function (err, items) {
    if (err) { throw err }
    items.forEach(function (item) {
      self.client.get(self.prefix + item, function (err, response) {
        var data = JSON.parse(response)
        self.remove(item, function (err, res) {
          self.process(data, function (err) {
            // Reschedule
            self.add(data)
          })
        })
      })
    })
  })
}

Scheduler.fn.process = function (item, cb) {
  this.processor(item, cb)
}

// Clears the schedule
Scheduler.fn.clear = function (cb) {
  var self = this

  this.client.zremrangebyscore([this.bucket, '-inf', '+inf'], function (err, response) {
    self.client.keys(self.prefix + '*', function (err, keys) {
      keys.forEach(function (key) {
        self.client.del(key)
      })
      if (cb) { cb(err, keys) }
    })
  })
}
