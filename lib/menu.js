'use strict'

const app = require('app')
const Menu = require('menu')
const MenuItem = require('menu-item')

const UPDATE_INTERVAL = 10000
var updateTimer

exports.buildMenu = function () {
  let menu = new Menu()

  menu.append(new MenuItem({
    label: 'Quit',
    click: function () {
      app.quit()
    }
  }))

  return menu
}

exports.rebuild = function (trayIcon) {
  let menu = exports.buildMenu()
  trayIcon.setContextMenu(menu)
}

exports.listen = function (trayIcon) {
  clearInterval(updateTimer)
  updateTimer = setInterval(function () {
    exports.rebuild()
  }, UPDATE_INTERVAL)
  exports.rebuild(trayIcon)
}
