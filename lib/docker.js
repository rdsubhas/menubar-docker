'use strict'

const spawn = require('child_process').spawn
const parseColumns = require('parse-columns')

let parseTable = function (data) {
  return parseColumns(data)
}
let parseLines = function (data) {
  return data.trim().split('\n')
}
let parseAsIs = function (data) {
  return data.trim()
}

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
  gatherStdout(stream, callback, parseTable)
}

exports.containers = function (machine, callback) {
  let commands = [
    'eval "$(docker-machine env ' + machine.NAME + ')"',
    'docker ps'
  ]

  let stream = spawn('sh', ['-c', commands.join(';')])
  gatherStdout(stream, callback, parseTable)
}

exports.startMachine = function (machine, callback) {
  console.log(`Starting machine ${machine.NAME}...`)
  let stream = spawn('docker-machine', ['start', machine.NAME])
  gatherStdout(stream, callback, parseAsIs)
}

exports.stopMachine = function (machine, callback) {
  console.log(`Stopping machine ${machine.NAME}...`)
  let stream = spawn('docker-machine', ['stop', machine.NAME])
  gatherStdout(stream, callback, parseAsIs)
}
