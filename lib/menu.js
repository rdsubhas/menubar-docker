'use strict'

const app = require('app')
const Menu = require('menu')
const MenuItem = require('menu-item')
const Promise = require('bluebird')
const Docker = Promise.promisifyAll(require('./docker'))

const UPDATE_INTERVAL = 10000
var updateTimer

let buildMainMenu = Promise.coroutine(function* (trayIcon) {
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

let buildMachineMenu = Promise.coroutine(function* (machineName) {
  let psMenu = new Menu()

  let ps = yield Docker.psAsync(machineName)
  for (let psName of ps) {
    psMenu.append(new MenuItem({
      label: psName
    }))
  }

  return new MenuItem({
    label: machineName,
    submenu: psMenu
  })
})

exports.listen = function (trayIcon) {
  buildMainMenu(trayIcon)
  clearInterval(updateTimer)
  updateTimer = setInterval(function () {
    buildMainMenu(trayIcon)
  }, UPDATE_INTERVAL)
}
