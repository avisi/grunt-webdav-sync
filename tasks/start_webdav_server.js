'use strict';
/**
 * Very simple webdav server
 */

var jsDAV = require("jsDAV/lib/jsdav");
var jsDAV_Server = require("jsDAV/lib/DAV/server");
var jsDAV_Locks_Backend_FS = require("jsDAV/lib/DAV/plugins/locks/fs");
var path = require("path");

module.exports = function(grunt) {

    grunt.registerMultiTask('start_webdav_server', 'Simple webdav server for testing', function() {
        var done = this.async();
        grunt.log.writeln("Starting test webdav server");
        var nodeDir = grunt.file.mkdir("tmp/assets");
        var server = jsDAV.createServer({
            node: path.resolve("tmp/assets"),
            locksBackend: jsDAV_Locks_Backend_FS.new(path.resolve("tmp/assets")),
        }, 9001);

        setTimeout(function(){
            grunt.log.ok("Hopefully the server is started..");
            done();
        }, 3000);

    });

};
