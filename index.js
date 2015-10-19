'use strict'

const app = require('app')
const BrowserWindow = require('browser-window')
const ipc = require('ipc')
const fixPath = require('fix-path')
const Tray = require('tray')
const Menu = require('./lib/menu')

// report crashes to the Electron project
require('crash-reporter').start()

let mainWindow

app.on('ready', function () {
  // Fix $PATH
  fixPath()

  // Hide in dock
  app.dock.hide()

  // Main window
  mainWindow = new BrowserWindow({
    show: false
  })

  let trayIcon = new Tray(__dirname + '/menu.png')
  Menu.listen(trayIcon)

  // Quit app
  ipc.on('app-quit', function () {
    app.quit()
  })
})
