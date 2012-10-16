var parse = require('frequency')
  , moment = require('moment')

module.exports = function (frequency) {
  if (typeof frequency === 'number') { return moment().add('seconds', frequency).unix() }
  var f = ~~frequency

  if (f) { return moment().add('seconds', f).unix() }

  var freq = parse(frequency)
  return freq ? moment().add(freq.moment()).unix() : null
}

