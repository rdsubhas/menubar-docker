'use strict'

const Lo = require('lodash')
const app = require('app')
const path = require('path')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = require('./docker')
const Config = require('./config')

const UPDATE_INTERVAL = 1000 * 60 * 15 // every 15 minutes
const IMAGES_FOLDER = path.resolve(app.getAppPath(), 'images')
var updateTimer, trayIcon

let statusIcon = function (bool, successIcon, failureIcon) {
  return IMAGES_FOLDER + '/' + (bool ? successIcon : failureIcon) + '.png'
}

let buildMainMenu = Promise.coroutine(function *() {
  let menu = new Menu()
  let machines = yield Docker.machines()
  let selectedMachine = Lo.find(machines, 'NAME', Config.get('selected_machine'))

  yield buildContainersMenu(menu, selectedMachine)

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: 'Select Machine',
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

  trayIcon.setImage(statusIcon(selectedMachine.isRunning, 'menuActive', 'menuTemplate'))
  trayIcon.setContextMenu(menu)
})

let buildMachinesMenu = Promise.coroutine(function *(machines, selectedMachine) {
  let menu = new Menu()
  for (let machine of machines) {
    menu.append(new MenuItem({
      label: machine.NAME,
      enabled: !(machine === selectedMachine),
      icon: statusIcon(machine.isRunning, 'circleGreen', 'circleRed'),
      click: Promise.coroutine(function *() {
        Config.set('selected_machine', machine.NAME)
        rebuildNow()
      })
    }))
  }
  return menu
})

let buildContainersMenu = Promise.coroutine(function *(menu, machine) {
  let docker = yield Docker.connect(machine)
  menu.append(new MenuItem({
    label: machine.NAME,
    enabled: false
  }))

  if (machine.isRunning) {
    let containers = yield docker.listContainersAsync({ all: true })
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      menu.append(containerMenu)
    }

    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(new MenuItem({
      label: 'Stop',
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
  let bestName = Lo.min(container.Names, "length")
  return new MenuItem({
    label: bestName.replace(/^\//, ''),
    icon: statusIcon(container.Status.match(/running/), 'circleGreen', 'circleRed')
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
