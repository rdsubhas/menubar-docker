'use strict'

const Lo = require('lodash')
const app = require('app')
const path = require('path')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = Promise.promisifyAll(require('./docker'))
const Config = require('./config')

const UPDATE_INTERVAL = 1000 * 60 * 15 // every 15 minutes
const IMAGES_FOLDER = path.resolve(app.getAppPath(), 'images')
var updateTimer, trayIcon

let buildMainMenu = Promise.coroutine(function *() {
  let menu = new Menu()
  let machines = yield Docker.machinesAsync()
  let selectedMachine = Lo.find(machines, 'NAME', Config.get('selected_machine'))

  yield buildContainersMenu(menu, selectedMachine)

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: 'Machine',
    submenu: (yield buildMachinesMenu(machines, selectedMachine))
  }))
  menu.append(new MenuItem({
    label: 'Refresh',
    click: rebuildNow
  }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: app.quit
  }))

  let selectedRunning = selectedMachine.STATE === 'Running'
  trayIcon.setImage(IMAGES_FOLDER + '/menu' + (selectedRunning ? 'Active' : 'Template') + '.png')
  trayIcon.setContextMenu(menu)
})

let buildMachinesMenu = Promise.coroutine(function *(machines, selectedMachine) {
  let menu = new Menu()
  for (let machine of machines) {
    let isRunning = machine.STATE === 'Running'
    menu.append(new MenuItem({
      label: machine.NAME,
      enabled: !(machine === selectedMachine),
      icon: IMAGES_FOLDER + '/circle' + (isRunning ? 'Green' : 'Red') + '.png',
      click: Promise.coroutine(function *() {
        Config.set('selected_machine', machine.NAME)
        rebuildNow()
      })
    }))
  }
  return menu
})

let buildContainersMenu = Promise.coroutine(function *(menu, machine) {
  machine.isRunning = machine.STATE === 'Running'

  if (machine.isRunning) {
    menu.append(new MenuItem({
      label: machine.NAME,
      enabled: false
    }))

    let containers = yield Docker.containersAsync(machine)
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      menu.append(containerMenu)
    }
    menu.append(new MenuItem({ type: 'separator' }))

    menu.append(new MenuItem({
      label: 'Stop all'
    }))
    menu.append(new MenuItem({
      label: 'Remove all'
    }))
    menu.append(new MenuItem({
      label: 'Shutdown',
      click: Promise.coroutine(function *() {
        yield Docker.stopMachineAsync(machine)
        rebuildNow()
      })
    }))
  } else {
    menu.append(new MenuItem({
      label: 'Start',
      click: Promise.coroutine(function *() {
        yield Docker.startMachineAsync(machine)
        rebuildNow()
      })
    }))
  }
})

let buildContainerMenu = Promise.coroutine(function *(machine, container) {
  return new MenuItem({
    label: container.NAMES
  })
})

let rebuildNow = function () {
  setTimeout(buildMainMenu, 0)
}

exports.watch = function (_trayIcon) {
  trayIcon = _trayIcon

  clearInterval(updateTimer)
  updateTimer = setInterval(buildMainMenu, UPDATE_INTERVAL)
  buildMainMenu()
}
