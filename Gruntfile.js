/* global module */

'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

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
    },
    copy: {
      src: {
        files: [{
          src: 'src/nbLazyBootstrap.js',
          dest: 'dist/nbLazyBootstrap.js'
        }]
      }
    }
  });
    
  grunt.registerTask('dist', function () {
    grunt.task.run(['uglify:src', 'copy:src']);
  });
};