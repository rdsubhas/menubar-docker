module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({

    copy: {
      all: {
        cwd: '.',
        dest: 'build/app/',
        src: [
          'images/**/*', 'lib/**/*', 'main.js', 'package.json',
          'node_modules/bluebird/**/*', 'node_modules/configstore/**/*',
          'node_modules/fix-path/**/*', 'node_modules/lodash/**/*',
          'node_modules/parse-columns/**/*'
        ]
      }
    },

    electron: {
      osx: {
        options: {
          name: 'Docker Menu',
          dir: 'build/app',
          asar: true,
          overwrite: true,
          out: 'build',
          platform: 'darwin',
          version: '0.34.0',
          arch: 'x64'
        }
      }
    }

  })

  grunt.registerTask('build', ['copy', 'electron'])
  grunt.registerTask('default', ['build'])
}
