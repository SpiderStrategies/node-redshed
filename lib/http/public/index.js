var shoe = require('shoe')
  , domready = require('domready')
  , es = require('event-stream')
  , moment = require('moment')

domready(function () {
  var result = document.getElementById('schedule')

  var stream = shoe('/redshed-schedule')
  var s = es.mapSync(function (msg) {
    result.innerHTML = ''
    var schedule = JSON.parse(msg)
    schedule.forEach(function (task) {
      var k = Object.keys(task)[0]
      var v = task[k]

      var tr = document.createElement('tr')
      var now = moment.unix(k)
      var when = document.createElement('td')
      when.appendChild(document.createTextNode(now.fromNow() + '(' + now.format('MMMM Do YYYY, h:mm:ss a') + ')'))

      var data = document.createElement('td')
      var code = document.createElement('code')
      code.appendChild(document.createTextNode(JSON.stringify(v, null, '\t')))
      data.appendChild(code)
      tr.appendChild(when)
      tr.appendChild(data)
      result.appendChild(tr)
    })
  })
  s.pipe(stream).pipe(s)
})
