'use strict'

const app = require('app')
const ipc = require('ipc')
const fixPath = require('fix-path')
const Tray = require('tray')
const Menu = require('./lib/menu')

// report crashes to the Electron project
require('crash-reporter').start()

app.on('ready', function () {
  // Fix $PATH
  fixPath()

  // Hide in dock
  app.dock.hide()

  let trayIcon = new Tray(app.getAppPath() + '/images/menuTemplate.png')
  trayIcon.setPressedImage(app.getAppPath() + '/images/menuPressed.png')
  Menu.watch(trayIcon)

  // Quit app
  ipc.on('app-quit', function () {
    app.quit()
  })
})
