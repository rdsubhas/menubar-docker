'use strict'

const app = require('app')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = Promise.promisifyAll(require('./docker'))

const UPDATE_INTERVAL = 10000
var updateTimer

let buildMainMenu = Promise.coroutine(function *(trayIcon) {
  let menu = new Menu()

  let machines = yield Docker.machinesAsync()
  for (let machineName of machines) {
    try {
      let machineMenu = yield buildMachineMenu(machineName)
      menu.append(machineMenu)
    } catch (e) {
      console.error(e)
    }
  }

  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: 'Quit',
    click: function () {
      app.quit()
    }
  }))

  trayIcon.setContextMenu(menu)
})

let buildMachineMenu = Promise.coroutine(function *(machineName) {
  let containersMenu = new Menu()

  let containers = yield Docker.containersAsync(machineName)
  for (let containerName of containers) {
    let containerMenu = yield buildContainerMenu(machineName, containerName)
    containersMenu.append(containerMenu)
  }

  return new MenuItem({
    label: machineName,
    submenu: containersMenu
  })
})

let buildContainerMenu = Promise.coroutine(function *(machineName, containerName) {
  return new MenuItem({
    label: containerName
  })
})

exports.listen = function (trayIcon) {
  buildMainMenu(trayIcon)
  clearInterval(updateTimer)
  updateTimer = setInterval(function () {
    buildMainMenu(trayIcon)
  }, UPDATE_INTERVAL)
}
