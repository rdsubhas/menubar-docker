'use strict'

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)
  let pkg = require('./package.json')

  let dep_files = Object.keys(pkg.dependencies).map(function (dep) {
    return 'node_modules/' + dep + '/**/*'
  })

  grunt.initConfig({

    clean: {
      dist: ['build'],
      options: {
        force: true
      }
    },

    copy: {
      sources: {
        cwd: '.',
        dest: 'build/app/',
        src: ['images/**/*', 'lib/**/*', 'main.js', 'package.json']
      },
      dependencies: {
        cwd: '.',
        dest: 'build/app/',
        src: dep_files
      }
    },

    electron: {
      osx: {
        options: {
          name: 'DockerMenu-' + pkg.version + '-Mac',
          dir: 'build/app',
          icon: 'images/DockerMenu.icns',
          'app-bundle-id': 'dockermenu',
          'app-version': pkg.version,
          asar: false,
          overwrite: true,
          out: 'build',
          platform: 'darwin',
          version: '0.34.1',
          arch: 'x64'
        }
      }
    }

  })

  grunt.registerTask('build', ['clean', 'copy', 'electron'])
  grunt.registerTask('default', ['build'])
}
