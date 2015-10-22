'use strict'

const Lo = require('lodash')
const dialog = require('dialog')
const Docker = require('./docker')
const Menu = require('./menu')
const Promise = require('bluebird')
const nullFn = function () {}

const MACHINE_TEMPLATE = Lo.template('Driver: <%= DRIVER %>\nURL: <%= URL %>\nState: <%= STATE %>')
const CONTAINER_TEMPLATE = Lo.template('Image: <%= Image %>\nCommand: <%= Command %>\nStatus: <%= Status %>\nPorts: <%= Portmaps %>')
const ALL_CONTAINERS_TEMPLATE = 'Stop all: Stops all running containers\nCleanup: Removes all stopped containers and untagged images'

exports.showMachineActions = function (machine) {
  let buttons = machine.isRunning ? ['Stop', 'Kill', 'Cancel'] : ['Start', 'Remove', 'Cancel']
  dialog.showMessageBox({
    title: machine.NAME,
    message: machine.NAME,
    detail: MACHINE_TEMPLATE(machine),
    type: 'info',
    buttons: buttons,
    noLink: true
  }, function (actionIndex) {
    switch (buttons[actionIndex]) {
      case 'Stop':
        Docker.machineAction([ 'stop', machine.NAME ]).then(Menu.rebuildNow)
        break
      case 'Start':
        Docker.machineAction([ 'start', machine.NAME ]).then(Menu.rebuildNow)
        break
      case 'Kill':
        Docker.machineAction([ 'kill', machine.NAME ]).then(Menu.rebuildNow)
        break
      case 'Remove':
        Docker.machineAction([ 'rm', machine.NAME ]).then(Menu.rebuildNow)
        break
    }
  })
}

exports.showContainerActions = function (machine, container) {
  let buttons = container.isRunning ? ['Stop', 'Kill', 'Cancel'] : ['Start', 'Remove', 'Cancel']
  let ports = container.Ports.map(function (port) {
    return `${port.Type}/${port.PrivatePort}:${port.PublicPort || '-'}`
  }).join(', ')
  container.Portmaps = ports
  dialog.showMessageBox({
    title: container.bestName,
    message: container.bestName,
    detail: CONTAINER_TEMPLATE(container),
    type: 'info',
    buttons: buttons,
    noLink: true
  }, function (actionIndex) {
    Docker.getContainer(machine, container).then(function (containerInstance) {
      switch (buttons[actionIndex]) {
        case 'Stop':
          containerInstance.stop(Menu.rebuildNow)
          break
        case 'Start':
          containerInstance.start(Menu.rebuildNow)
          break
        case 'Remove':
          containerInstance.remove(Menu.rebuildNow)
          break
        case 'Kill':
          containerInstance.kill(Menu.rebuildNow)
          break
      }
    })
  })
}

exports.showAllContainerActions = function (machine, containers) {
  let buttons = ['Stop all', 'Cleanup', 'Cancel']
  dialog.showMessageBox({
    title: machine.NAME,
    message: machine.NAME,
    detail: ALL_CONTAINERS_TEMPLATE,
    type: 'info',
    buttons: buttons,
    noLink: true
  })
}
