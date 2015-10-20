module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({

    electron: {
      osx: {
        options: {
          name: 'Docker Menu',
          dir: '.',
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

  grunt.registerTask('build', ['electron'])
  grunt.registerTask('default', ['build'])
}
