'use strict'

const spawn = require('child_process').spawn
const parseColumns = require('parse-columns')

let gatherStdout = function (stream, callback, formatter) {
  let buffer = new Buffer('')
  stream.stdout.on('data', function (data) {
    buffer = Buffer.concat([ buffer, data ])
  })

  stream.on('close', function (code) {
    if (code === 0) {
      let data = formatter(buffer.toString())
      callback(null, data)
    } else {
      callback(code)
    }
  })
}

exports.machines = function (callback) {
  let stream = spawn('docker-machine', ['ls'])
  gatherStdout(stream, callback, parseColumns)
}

exports.containers = function (machine, callback) {
  let commands = [
    'eval "$(docker-machine env ' + machine.NAME + ')"',
    'docker ps'
  ]

  let stream = spawn('sh', ['-c', commands.join(';')])
  gatherStdout(stream, callback, parseColumns)
}
