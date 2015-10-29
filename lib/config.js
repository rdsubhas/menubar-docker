const app = require('app')
const path = require('path')
const fs = require('fs')
const prefsPath = path.join(app.getPath('userData'), 'prefs.json')

var prefs = {}

module.exports = {

  get: function (key) {
    return prefs[key]
  },

  set: function (key, value) {
    prefs[key] = value
    this.save()
  },

  load: function () {
    try {
      prefs = JSON.parse(fs.readFileSync(prefsPath).toString())
    } catch (e) {
      prefs = {}
    }
  },

  save: function () {
    fs.writeFile(prefsPath, JSON.stringify(prefs))
  }

}

module.exports.load()
