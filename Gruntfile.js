/* global module */

'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    uglify: {
      src: {
        options: {
          sourceMap: false,
          preserveComments: false,
          report: 'gzip'
        },
        files: {
          'dist/nbLazyBootstrap.min.js': [
            'src/*.js',
            'src/**/*.js'
          ]
        }
      }
    }
  });
    
  grunt.registerTask('dist', function () {
    grunt.task.run(['uglify:src']);
  });
};