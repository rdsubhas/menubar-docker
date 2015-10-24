'use strict'

const autoUpdater = require('auto-updater')
const pkg = require('../package.json')
const autoUpdateUrl = `http://docker-menu-updater.herokuapp.com/v1/rdsubhas/docker-menu/${pkg.version}`

autoUpdater.on('error', function () {
  console.log('error', arguments)
})

autoUpdater.on('checking-for-update', function () {
  console.log('checking-for-update', arguments)
})

autoUpdater.on('update-available', function () {
  console.log('update-available', arguments)
})

autoUpdater.on('update-not-available', function () {
  console.log('update-not-available', arguments)
})

autoUpdater.on('update-downloaded', function () {
  console.log('update-downloaded', arguments)
})

autoUpdater.setFeedUrl(autoUpdateUrl)

module.exports = autoUpdater
