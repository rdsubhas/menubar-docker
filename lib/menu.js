'use strict'

const Lo = require('lodash')
const path = require('path')
const app = require('app')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = Promise.promisifyAll(require('./docker'))

const UPDATE_INTERVAL = 10000
var updateTimer

let buildMainMenu = Promise.coroutine(function *(trayIcon) {
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
    label: 'Start all'
  }))
  menu.append(new MenuItem({
    label: 'Shutdown all'
  }))

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: function () {
      app.quit()
    }
  }))

  trayIcon.setContextMenu(menu)

  let anyRunning = Lo.any(machines, "STATE", "Running")
  if (anyRunning) {
    trayIcon.setImage(path.resolve(__dirname, '../images/menu-active.png'))
  } else {
    trayIcon.setImage(path.resolve(__dirname, '../images/menu-light.png'))
  }
})

let buildMachineMenu = Promise.coroutine(function *(machine) {
  var running = machine.STATE === 'Running'
  let containersMenu = new Menu()

  containersMenu.append(new MenuItem({
    label: 'Containers',
    enabled: false
  }))

  if (running) {
    let containers = yield Docker.containersAsync(machine)
    for (let container of containers) {
      let containerMenu = yield buildContainerMenu(machine, container)
      containersMenu.append(containerMenu)
    }

    containersMenu.append(new MenuItem({ type: 'separator' }))
  }

  containersMenu.append(new MenuItem({
    label: 'Stop all'
  }))
  containersMenu.append(new MenuItem({
    label: 'Remove all'
  }))

  containersMenu.append(new MenuItem({ type: 'separator' }))
  containersMenu.append(new MenuItem({
    label: 'Start'
  }))
  containersMenu.append(new MenuItem({
    label: 'Shutdown'
  }))

  return new MenuItem({
    label: machine.NAME,
    icon: path.resolve(__dirname, '../images/circle-' + (running ? 'green' : 'red') + '.png'),
    submenu: containersMenu
  })
})

let buildContainerMenu = Promise.coroutine(function *(machine, container) {
  return new MenuItem({
    label: container.NAMES
  })
})

exports.watch = function (trayIcon) {
  buildMainMenu(trayIcon)
  clearInterval(updateTimer)
  updateTimer = setInterval(function () {
    buildMainMenu(trayIcon)
  }, UPDATE_INTERVAL)
}
