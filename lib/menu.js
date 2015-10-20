'use strict'

const Lo = require('lodash')
const path = require('path')
const app = require('app')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = Promise.promisifyAll(require('./docker'))

const UPDATE_INTERVAL = 1000 * 60 * 15 // every 15 minutes
var updateTimer, trayIcon

let buildMainMenu = Promise.coroutine(function *() {
  let menu = new Menu()
  menu.append(new MenuItem({
    label: 'Machines',
    enabled: false
  }))

  let machines = yield Docker.machinesAsync()
  for (let machine of machines) {
    try {
      let machineMenu = yield buildMachineMenu(machine)
      menu.append(machineMenu)
    } catch (e) {
      console.error(e)
    }
  }

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: 'Refresh',
    click: rebuildNow
  }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: app.quit
  }))

  let anyRunning = Lo.any(machines, "isRunning", true)
  trayIcon.setImage(path.resolve(__dirname, '../images/menu' + (anyRunning ? 'Active' : 'Template') + '.png'))
  trayIcon.setContextMenu(menu)
})

let buildMachineMenu = Promise.coroutine(function *(machine) {
  machine.isRunning = machine.STATE === 'Running'
  let submenu = new Menu()

  if (machine.isRunning) {
    submenu.append(new MenuItem({
      label: 'Containers',
      enabled: false
    }))

    let containers = yield Docker.containersAsync(machine)
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      submenu.append(containerMenu)
    }
    submenu.append(new MenuItem({ type: 'separator' }))

    submenu.append(new MenuItem({
      label: 'Stop all'
    }))
    submenu.append(new MenuItem({
      label: 'Remove all'
    }))
    submenu.append(new MenuItem({ type: 'separator' }))

    submenu.append(new MenuItem({
      label: 'Shutdown',
      click: Promise.coroutine(function*() {
        yield Docker.stopMachineAsync(machine)
        rebuildNow()
      })
    }))
  } else {
    submenu.append(new MenuItem({
      label: 'Start',
      click: Promise.coroutine(function*() {
        yield Docker.startMachineAsync(machine)
        rebuildNow()
      })
    }))
  }

  return new MenuItem({
    label: machine.NAME,
    icon: path.resolve(__dirname, '../images/circle' + (machine.isRunning ? 'Green' : 'Red') + '.png'),
    submenu: submenu
  })
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
