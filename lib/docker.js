'use strict'

const Promise = require('bluebird')
const child_process = Promise.promisifyAll(require('child_process'))
const parseColumns = require('parse-columns')
const fs = require('fs')
const Docker = require('dockerode')
const nullFn = function () {}
Promise.promisifyAll(Docker.prototype)

exports.machines = function () {
  return child_process.execFileAsync('docker-machine', ['ls']).spread(function (stdout, stderr) {
    return parseColumns(stdout).map(function (machine) {
      machine.isRunning = machine.STATE && machine.STATE.toLowerCase() === 'running'
      return machine
    })
  })
}

exports.startMachine = function (machine) {
  return child_process.execFileAsync('docker-machine', ['start', machine.NAME]).catch(nullFn)
}

exports.stopMachine = function (machine) {
  return child_process.execFileAsync('docker-machine', ['stop', machine.NAME]).catch(nullFn)
}

exports.connect = function (machine) {
  return child_process.execFileAsync('docker-machine', ['inspect', machine.NAME]).spread(function (stdout, stderr) {
    let json = JSON.parse(stdout)
    let driver = json.Driver
    let auth = json.HostOptions.AuthOptions
    return new Docker({
      host: json.Driver.IPAddress,
      port: json.Driver.Port || 2376,
      ca: (auth.CaCertPath ? fs.readFileSync(auth.CaCertPath) : null),
      cert: (auth.ClientCertPath ? fs.readFileSync(auth.ClientCertPath) : null),
      key: (auth.ClientKeyPath ? fs.readFileSync(auth.ClientKeyPath) : null)
    })
  })
}
