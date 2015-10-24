'use strict'

const Promise = require('bluebird')
const child_process = Promise.promisifyAll(require('child_process'))
const parseColumns = require('parse-columns')
const fs = require('fs')
const Docker = require('dockerode')
const nullFn = function () {}
Promise.promisifyAll(Docker.prototype)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

exports.machineAction = function (args) {
  return child_process.execFileAsync('docker-machine', args).catch(nullFn)
}

exports.machines = function () {
  return exports.machineAction([ 'ls' ]).spread(function (stdout, stderr) {
    return parseColumns(stdout).map(function (machine) {
      machine.isRunning = machine.STATE && machine.STATE.toLowerCase().indexOf('running') >= 0
      return machine
    })
  })
}

exports.connect = function (machine) {
  return child_process.execFileAsync('docker-machine', ['inspect', machine.NAME]).spread(function (stdout, stderr) {
    let json = JSON.parse(stdout)
    let driver = json.Driver
    let auth = json.HostOptions.AuthOptions
    return new Docker({
      host: driver.IPAddress,
      port: driver.Port || 2376,
      ca: (auth.CaCertPath ? fs.readFileSync(auth.CaCertPath) : null),
      cert: (auth.ClientCertPath ? fs.readFileSync(auth.ClientCertPath) : null),
      key: (auth.ClientKeyPath ? fs.readFileSync(auth.ClientKeyPath) : null)
    })
  })
}

exports.getContainer = function (machine, container) {
  return exports.connect(machine).then(function (docker) {
    return docker.getContainer(container.Id)
  })
}
