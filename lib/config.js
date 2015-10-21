const ConfigStore = require('configstore')
const pkg = require('../package.json')

module.exports = new ConfigStore(pkg.name)
