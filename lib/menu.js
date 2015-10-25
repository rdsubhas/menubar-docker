'use strict'

const Lo = require('lodash')
const app = require('app')
const path = require('path')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Dialog = require('./dialog')
const Promise = require('bluebird')
const Docker = require('./docker')
const Config = require('./config')

const UPDATE_INTERVAL = 1000 * 60 * 15 // every 15 minutes
const IMAGES_FOLDER = path.resolve(app.getAppPath(), 'images')
var updateTimer, trayIcon

const statusIcon = function (bool, successIcon, failureIcon) {
  return IMAGES_FOLDER + '/' + (bool ? successIcon : failureIcon) + '.png'
}

const buildMainMenu = Promise.coroutine(function *() {
  let menu = new Menu()

  if (Docker.dockerMachineInstalled()) {
    try {
      yield buildSelectedMenu(menu)
    } catch (e) {
      console.error(e)
      menu.append(new MenuItem({
        label: 'Error fetching data!',
        enabled: false
      }))
      menu.append(new MenuItem({ type: 'separator' }))
      trayIcon.setImage(statusIcon(true, 'menuTemplate'))
    }
  } else {
    Dialog.locateDockerMachine()
  }

  menu.append(yield buildOptionsMenu())
  menu.append(new MenuItem({
    label: 'Refresh',
    click: rebuildNow
  }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: app.quit
  }))

  trayIcon.setContextMenu(menu)
})

const buildSelectedMenu = Promise.coroutine(function *(menu) {
  let machines = yield Docker.machines()
  let selectedMachine = Lo.find(machines, 'NAME', Config.get('selected_machine'))
  selectedMachine.isSelected = true

  if (selectedMachine) {
    yield buildContainersMenu(menu, selectedMachine)
    menu.append(new MenuItem({ type: 'separator' }))
  }

  yield buildMachinesMenu(menu, machines)
  menu.append(new MenuItem({ type: 'separator' }))

  menu.append(yield buildSwitchMenu(machines, selectedMachine))
  trayIcon.setImage(statusIcon(selectedMachine.isRunning, 'menuActive', 'menuTemplate'))
})

const buildSwitchMenu = Promise.coroutine(function *(machines, selectedMachine) {
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

const buildMachinesMenu = Promise.coroutine(function *(menu, machines) {
  menu.append(new MenuItem({
    label: 'Machines',
    enabled: false
  }))
  for (let machine of machines) {
    let machineMenu = yield buildMachineMenu(machine)
    menu.append(machineMenu)
  }
})

const buildMachineMenu = Promise.coroutine(function *(machine) {
  return new MenuItem({
    label: machine.NAME,
    icon: statusIcon(machine.isRunning, 'circleGreen', 'circleRed'),
    click: function () {
      Dialog.showMachineActions(machine)
    }
  })
})

const buildContainersMenu = Promise.coroutine(function *(menu, machine) {
  if (machine.isRunning) {
    let docker = yield Docker.connect(machine)
    let containers = yield docker.listContainersAsync({ all: true })
    menu.append(new MenuItem({
      label: 'Containers (' + machine.NAME + ')',
      enabled: false
    }))
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      menu.append(containerMenu)
    }
    if (containers.length > 0) {
      menu.append(new MenuItem({
        label: 'All...',
        click: function () {
          Dialog.showAllContainerActions(machine, containers)
        }
      }))
    }
  }
})

const buildContainerMenu = Promise.coroutine(function *(machine, container) {
  container.bestName = Lo.min(container.Names, 'length').replace(/^\//, '')
  container.isRunning = !!container.Status.match(/^(running|up)/i)
  return new MenuItem({
    label: container.bestName,
    icon: statusIcon(container.isRunning, 'boxGreen', 'boxRed'),
    click: function () {
      Dialog.showContainerActions(machine, container)
    }
  })
})

const buildOptionsMenu = Promise.coroutine(function *() {
  let menu = new Menu()
  menu.append(new MenuItem({
    label: 'Locate docker-machine',
    click: function () {
      Dialog.locateDockerMachine()
    }
  }))

  return new MenuItem({
    label: 'Options',
    submenu: menu
  })
})

const rebuildNow = function () {
  setTimeout(buildMainMenu, 0)
}

const watch = function (_trayIcon) {
  trayIcon = _trayIcon
  clearInterval(updateTimer)
  updateTimer = setInterval(buildMainMenu, UPDATE_INTERVAL)
  rebuildNow()
}

exports.rebuildNow = rebuildNow
exports.watch = watch
