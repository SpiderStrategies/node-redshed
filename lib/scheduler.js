var next = require('./next')
  , moment = require('moment')
  , async = require('async')
  , noop = function () {}

var Scheduler = function (opts, poll) {
  if (!opts) {
    throw new Error('Must pass options')
  }
  if (!opts.process) {
    throw new Error('Must pass process callback')
  }
  if (typeof poll === 'undefined') {
    poll = true
  }

  var redis = opts.redis || require('redis')
     , RedisClient = redis.RedisClient

  if (opts.redisClient instanceof RedisClient) {
    this.client = opts.redisClient
  } else {
    this.client = redis.createClient()
  }

  this.prefix = (opts.prefix || 'rs') + ':'
  this.bucket = (this.prefix) + (opts.bucket || 'set')
  this.processor = opts.process
  this.identifier = opts.identifier || '_id'
  this.interval = opts.poll || 750

  if (poll) {
    this._init()
  }
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

  this.schedule('-inf', moment().unix(), function (err, items) {
    if (err) { throw err }
    items.forEach(function (item) {
      var value = item[Object.keys(item)[0]]
      self.remove(value[self.identifier], function (err, res) {
        self.process(value, function (err) {
          // Reschedule
          self.add(value)
        })
      })
    })
  })
}

Scheduler.fn.schedule = function (min, max, cb) {
  var self = this
    , args = [this.bucket, min, max, 'WITHSCORES']

  this.client.zrangebyscore(args, function (err, items) {
    if (err) { cb(err, null) }

    var ids = items.filter(function (item, i) { return i % 2 === 0 })
    async.map(ids, function (item, done) {
      self.client.get(self.prefix + item, function (err, response) {
        var data = JSON.parse(response)
        done(null, data)
      })
    }, function (err, results) {
      cb(err, results.map(function (r, i) {
        var obj = {}
        obj[items[(i * 2) + 1]] = r
        return obj
      }))
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
