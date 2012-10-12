var assert = require('assert')
  , next = require('../lib/next')
  , redis = require('redis')
  , client = redis.createClient()
  , Redshed = require('../index')

describe('Redshed', function () {

  describe('scheduler', function () {
    var scheduler

    it('sets defaults', function () {
      assert.equal(scheduler.interval, 750)
      assert.equal(scheduler.prefix, 'rs:test:')
      assert.equal(scheduler.bucket, 'rs:test:set')
      assert.equal(scheduler.identifier, '_id')
    })

    it('polls', function (done) {
      var called = 0
      var origin = Redshed.prototype.poll
      Redshed.prototype.poll = function () { called++ }
      var s = new Redshed({ process: function () {}, poll: 10 })
      setTimeout(function () {
        assert(called, 10)
        Redshed.prototype.poll = origin
        done()
      }, 100)
    })

    it('adds to the schedule', function (done) {
      var item = {
        _id: 1,
        frequency: '10 minutes'
      }
      var now = new Date().getTime() / 1000
      scheduler.add(item, function (err, reply) {
        assert(!err)
        assert.equal(reply.length, 2)
        client.zcard(scheduler.bucket, function (err, answer) {
          assert.equal(answer, 1)
          client.zscore(scheduler.bucket, 1, function (err, score) {
            assert.equal(Math.floor(now + (10 * 60)), score)
            client.get(scheduler.prefix + '1', function (err, val) {
              assert.deepEqual(item, JSON.parse(val))
              done()
            })
          })
        })
      })
    })

    it('invokes caller processor', function (done) {
      var invoked = false
      scheduler.processor = function (item, cb) { invoked = true; cb()}
      scheduler.process({_id: 1}, function () {
        assert(invoked)
        done()
      })
    })

    it('processes and reschedules', function (done) {
      var item = { _id: 90, frequency: 1 } // 1 second
      var called = 0
      var faster = new Redshed({
        poll: 20,
        process: function (i, cb) {
          assert.deepEqual(item, i)
          cb()
          if (++called === 2) { done() }
        }
      })
      faster.add(item)
    })

    it('removes from the schedule', function (done) {
      var invoked = false
      var item = { _id: 100, frequency: '1 second' }
      scheduler.processer = function () { invoked = true }
      scheduler.add(item, function (err, reply) {
        scheduler.remove(100, function () {
          client.get(scheduler.prefix + '100', function (err, result) {
            assert(!result)
            client.zcard(scheduler.prefix, function (err, answer) {
              assert.equal(answer, 0)
              done()
            })
          })
        })
      })
    })

    beforeEach(function () {
      scheduler = new Redshed({ process: function () {}, prefix: 'rs:test' })
    })

    afterEach(function () {
      scheduler.clear()
    })

  })

  describe('next', function () {
    it('parses', function () {
      var now = new Date()
      assert(next('7 seconds'))
      assert.equal(typeof next('7 seconds'), 'number')

      assert(!next('7 foobars'))
      assert(next(7))
      assert.equal(typeof next('7'), 'number')
      assert.equal(next('7'), 7)
    })

  })

})
