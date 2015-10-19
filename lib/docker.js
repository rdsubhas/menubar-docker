'use strict'

const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

let gatherStdout = function (stream, callback, formatter) {
  let buffer = new Buffer('')
  stream.stdout.on('data', function (data) {
    buffer = Buffer.concat([ buffer, data ])
  })

  stream.on('close', function (code) {
    if (code == 0) {
      let lines = buffer.toString().trim().split("\n").map(formatter)
      callback(null, lines)
    } else {
      callback(code)
    }
  })
}

exports.machines = function (callback) {
  let stream = spawn('docker-machine', ['ls', '-q'])
  gatherStdout(stream, callback, function (data) {
    return data.toString()
  })
}

exports.containers = function (machine, callback) {
  let commands = [
    'eval "$(docker-machine env ' + machine + ')"',
    'docker ps --format "{{.Names}}"'
  ]

  let stream = spawn('sh', ['-c', commands.join(';')])
  gatherStdout(stream, callback, function (data) {
    return data.toString()
  })
}
