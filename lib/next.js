var parse = require('frequency')
  , moment = require('moment')

module.exports = function (frequency) {
  if (typeof frequency === 'number') { return frequency }
  var f = ~~frequency

  if (f) { return f }

  var freq = parse(frequency)
  return freq ? moment().add(freq.moment()).unix() : null
}

