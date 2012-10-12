var assert = require('assert')
  , next = require('../lib/next')

describe('Redshed', function () {

  describe('scheduler', function () {

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