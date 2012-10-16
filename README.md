node-redshed
============

A node scheduler backed by redis.

This module implements a scheduling by storing items in a sorted set. The sorted set is scored on the unix time it should be scheduled. Each item specifies a
frequency of when it should be processed. Right now, each job will reschedule itself, based on its frequency.

It's potentially useful to add this module on top of a job queue, such as [kue](https://github.com/LearnBoost/kue) or [crane](https://github.com/jaredhanson/crane) to schedule jobs.


## Usage

`$ npm install redshed`


Create a scheduler

```
var Redshed = require('redshed')

scheduler = new Redshed({
  process: function (item, cb) {
    // When an item is ready, this callback is fired
    // (Add to a job queue, or whatever)
    // Invoke the callback when you're done processing, so we can reschedule
  }
})

```

Schedule things
```
scheduler.add({
  _id: 3930,
  frequency: '45 seconds',
  data: { foo: 'Gizmo' },
  malarkey: true
})
```

## Web app

You can view the scheduler by loading the app:

```
var app = require('redshed').app(<scheduler options>)

var server = app.listen(3015)
// Lame, I know
app.initsock(server)

```

## Options
When you create the scheduler, you must pass it options:

  * **processor**: Required, What to do with the data when its ready

  * **prefix**: Optional, prefix for the redis set

  * **bucket**: Optional, bucket name

  * **identifier**: Optional, default: _id, Identifier for the object in the set. The stored object must have this property

### Frequencies
---------------
Each item sent into the scheduler must have a property *frequency*. This can be a simple number, indicating number or seconds, or it can be a simple expression, such as *5 minutes*,
*45 seconds*, *1 hour*, etc.

