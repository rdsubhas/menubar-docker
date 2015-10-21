'use strict'

const Lo = require('lodash')
const app = require('app')
const path = require('path')
const Menu = require('menu')
const MenuItem = require('menu-item')
const dialog = require('dialog')
const Promise = require('bluebird')
const Docker = require('./docker')
const Config = require('./config')

const UPDATE_INTERVAL = 1000 * 60 * 15 // every 15 minutes
const IMAGES_FOLDER = path.resolve(app.getAppPath(), 'images')
var updateTimer, trayIcon

let containerTemplate = Lo.template('Image: <%= Image %>\nCommand: <%= Command %>\nPorts: <%= Portmaps %>\nStatus: <%= Status %>')

let statusIcon = function (bool, successIcon, failureIcon) {
  return IMAGES_FOLDER + '/' + (bool ? successIcon : failureIcon) + '.png'
}

let buildMainMenu = Promise.coroutine(function *() {
  let menu = new Menu()
  let machines = yield Docker.machines()
  let selectedMachine = Lo.find(machines, 'NAME', Config.get('selected_machine'))

  if (selectedMachine) {
    menu.append(yield buildMachineMenu(selectedMachine))
    menu.append(new MenuItem({ type: 'separator' }))

    yield buildContainersMenu(menu, selectedMachine)
    menu.append(new MenuItem({ type: 'separator' }))
  }

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(yield buildSwitchMenu(machines, selectedMachine))
  menu.append(new MenuItem({
    label: 'Refresh',
    click: rebuildNow
  }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: app.quit
  }))

  trayIcon.setImage(statusIcon(selectedMachine.isRunning, 'menuActive', 'menuTemplate'))
  trayIcon.setContextMenu(menu)
})

let buildSwitchMenu = Promise.coroutine(function *(machines, selectedMachine) {
  let menu = new Menu()
  for (let machine of machines) {
    let selected = machine.NAME === selectedMachine.NAME
    menu.append(new MenuItem({
      label: machine.NAME,
      checked: selected,
      enabled: !selected,
      click: function () {
        Config.set('selected_machine', machine.NAME)
        rebuildNow()
      }
    }))
  }

  return new MenuItem({
    label: 'Select Machine',
    submenu: menu
  })
})

let buildMachinesMenu = Promise.coroutine(function *(menu, machines) {
  menu.append(new MenuItem({
    label: 'Machines',
    enabled: false
  }))
  for (let machine of machines) {
    let machineMenu = yield buildMachineMenu(machine)
    menu.append(machineMenu)
  }
})

let buildMachineMenu = Promise.coroutine(function *(machine) {
  let menu = new Menu()
  if (machine.isRunning) {
    menu.append(new MenuItem({
      label: 'Stop',
      click: Promise.coroutine(function *() {
        yield Docker.stopMachine(machine)
        rebuildNow()
      })
    }))
  } else {
    menu.append(new MenuItem({
      label: 'Start',
      click: Promise.coroutine(function *() {
        yield Docker.startMachine(machine)
        rebuildNow()
      })
    }))
  }

  return new MenuItem({
    label: machine.NAME,
    icon: statusIcon(machine.isRunning, 'circleGreen', 'circleRed'),
    submenu: menu
  })
})

let buildContainersMenu = Promise.coroutine(function *(menu, machine) {
  if (machine.isRunning) {
    let docker = yield Docker.connect(machine)
    let containers = yield docker.listContainersAsync({ all: true })
    menu.append(new MenuItem({
      label: 'Containers',
      enabled: false
    }))
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      menu.append(containerMenu)
    }
  }
})

let buildContainerMenu = Promise.coroutine(function *(machine, container) {
  container.bestName = Lo.min(container.Names, "length").replace(/^\//, '')
  container.isRunning = !!container.Status.match(/^(running|up)/i)
  return new MenuItem({
    label: container.bestName,
    icon: statusIcon(container.isRunning, 'boxGreen', 'boxRed'),
    click: function () {
      showContainerActions(machine, container)
    }
  })
})

let showContainerActions = function (machine, container) {
  let buttons = container.isRunning ? ['Stop', 'Kill', 'Cancel'] : ['Start', 'Remove', 'Cancel']
  let ports = container.Ports.map(function (port) {
    return `${port.Type}/${port.PrivatePort}:${port.PublicPort || '-'}`
  }).join(', ')
  container.Portmaps = ports
  dialog.showMessageBox({
    title: container.bestName,
    message: container.bestName,
    detail: containerTemplate(container),
    type: 'info',
    icon: statusIcon(container.isRunning, 'boxGreen', 'boxRed'),
    buttons: buttons,
    noLink: true
  }, function (actionIndex) {
    Docker.getContainer(machine, container).then(function (containerInstance) {
      switch (buttons[actionIndex]) {
        case 'Stop':
          containerInstance.stop(rebuildNow)
          break
        case 'Start':
          containerInstance.start(rebuildNow)
          break
        case 'Remove':
          containerInstance.remove(rebuildNow)
          break
        case 'Kill':
          containerInstance.kill(rebuildNow)
          break
      }
    })
  })
}

let rebuildNow = function () {
  setTimeout(buildMainMenu, 0)
}

exports.watch = function (_trayIcon) {
  trayIcon = _trayIcon

  clearInterval(updateTimer)
  updateTimer = setInterval(buildMainMenu, UPDATE_INTERVAL)
  buildMainMenu()
}
