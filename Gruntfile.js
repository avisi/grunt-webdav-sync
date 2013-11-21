/*
 * grunt-webdav-sync
 * https://github.com/mitchel/grunt-webdav-sync
 *
 * Copyright (c) 2013 Mitchel Kuijpers
 * Licensed under the MIT license.
 */

'use strict';

var jsDAV = require("jsDAV/lib/jsdav");
var jsDAV_Server = require("jsDAV/lib/DAV/server");
var jsDAV_Locks_Backend_FS = require("jsDAV/lib/DAV/plugins/locks/fs");
var jsDAV_Auth_Backend_File = require("jsDAV/lib/DAV/plugins/auth/file");
var path = require("path");

module.exports = function(grunt) {
  

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    webdav_sync: {
        default: {
            options: {
                local_path: 'test/assets/upload/**',
                remote_path: 'http://avisi:test@localhost:9001'
            }
        },
        other: {
            options: {
                local_path: 'test/assets/upload2/**',
                remote_path: 'http://avisi:test@localhost:9001/very/'
            }
        }
    },

  start_webdav_server: {
      default: {}
  },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerMultiTask('start_webdav_server', 'Simple webdav server for testing', function() {
      var done = this.async();
      grunt.log.writeln("Starting test webdav server");
      var nodeDir = grunt.file.mkdir("tmp/assets");

      // jsDAV.debugMode = true;
      var server = jsDAV.createServer({
          node: path.resolve("tmp/assets"),
          locksBackend: jsDAV_Locks_Backend_FS.new(path.resolve("tmp/assets")),
          // authBackend: jsDAV_Auth_Backend_File.new(path.resolve("htdigest")),
          // realm: "avisirealm"
      }, 9001);

      setTimeout(function(){
          grunt.log.ok("Hopefully the server is started..");
          done();
      }, 3000);

  });

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'start_webdav_server', 'webdav_sync', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test', 'start_webdav_server']);

};
